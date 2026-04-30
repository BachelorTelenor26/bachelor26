import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { decodeHandoverCode, deriveFlowId } from "@/app/lib/sessionCode";

type PrismaChoice = {
  id: string;
  sortOrder: number;
  isTerminal: boolean;
  nextStepId: string | null;
  label: string;
};

type PrismaStep = {
  id: string;
  title: string;
  localeKey: string;
  choices: PrismaChoice[];
};

async function readLocale(localeKey: string): Promise<{ title?: string; choices?: { label: string }[] } | null> {
  try {
    const file = path.join(process.cwd(), "public", "locales", `${localeKey}.json`);
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findRootStep(steps: PrismaStep[]): PrismaStep | undefined {
  const referenced = new Set(
    steps.flatMap((s) => s.choices.map((c) => c.nextStepId).filter(Boolean))
  );
  return steps.find((s) => !referenced.has(s.id));
}

function autoFollowSingle(step: PrismaStep, steps: PrismaStep[]): PrismaStep {
  let cur = step;
  const seen = new Set<string>();
  while (true) {
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    const sorted = [...cur.choices].sort((a, b) => a.sortOrder - b.sortOrder);
    if (sorted.length !== 1 || sorted[0].isTerminal || !sorted[0].nextStepId) break;
    const next = steps.find((s) => s.id === sorted[0].nextStepId);
    if (!next) break;
    cur = next;
  }
  return cur;
}

async function resolvePath(
  steps: PrismaStep[],
  choiceIndices: number[]
): Promise<Array<{ id: string; stepTitle: string; choiceLabel: string | null }>> {
  const raw = findRootStep(steps);
  if (!raw) return [];
  let current: PrismaStep | undefined = autoFollowSingle(raw, steps);
  const result: Array<{ id: string; stepTitle: string; choiceLabel: string | null }> = [];

  for (let i = 0; i < choiceIndices.length && current; i++) {
    const sorted: PrismaChoice[] = [...current.choices].sort((a, b) => a.sortOrder - b.sortOrder);
    const chosen: PrismaChoice | undefined = sorted[choiceIndices[i]];

    const locale = await readLocale(current.localeKey);
    const stepTitle = locale?.title ?? current.title;
    const choiceLabel = locale?.choices?.[choiceIndices[i]]?.label ?? chosen?.label ?? null;

    result.push({ id: current.id, stepTitle, choiceLabel });
    if (!chosen || chosen.isTerminal || !chosen.nextStepId) break;
    const rawNext: PrismaStep | undefined = steps.find((s) => s.id === chosen.nextStepId);
    current = rawNext ? autoFollowSingle(rawNext, steps) : undefined;
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionCode =
      typeof body?.sessionCode === "string" ? (body.sessionCode as string).trim() : null;

    if (!sessionCode) {
      return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
    }

    const payload = decodeHandoverCode(sessionCode);
    if (!payload) {
      return NextResponse.json({ error: "Ugyldig sesjonskode" }, { status: 400 });
    }

    // Find the article whose slug hashes to this flowId
    const articles = await prisma.article.findMany({
      select: { id: true, slug: true },
    });
    const article = articles.find((a) => deriveFlowId(a.slug) === payload.flowId);

    if (!article) {
      return NextResponse.json(
        { error: "Fant ingen guide for denne koden" },
        { status: 404 }
      );
    }

    // Upsert so repeated agent lookups are idempotent
    const session = await prisma.troubleshootingSession.upsert({
      where: { sessionCode },
      create: {
        sessionCode,
        articleId: article.id,
        outcome: "IN_PROGRESS",
      },
      update: {}, // preserve outcome/escalationReason if already set
      include: {
        article: {
          include: {
            category: true,
            deviceType: true,
            steps: {
              include: {
                choices: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
        answers: {
          include: { step: true, choice: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const resolvedPath = await resolvePath(session.article.steps, payload.choices);

    return NextResponse.json({ ...session, resolvedPath });
  } catch (error) {
    console.error("Feil i POST /api/sessions:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette sesjon" },
      { status: 500 }
    );
  }
}

