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

async function readLocale(localeKey: string): Promise<{
  title?: string;
  body?: { type: string; content?: { text: string }[]; items?: { text: string }[][] }[];
  choices?: { label: string }[];
} | null> {
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
): Promise<Array<{ stepId: string; choiceId: string | null }>> {
  const raw = findRootStep(steps);
  if (!raw) return [];
  let current: PrismaStep | undefined = autoFollowSingle(raw, steps);
  const result: Array<{ stepId: string; choiceId: string | null }> = [];

  for (let i = 0; i < choiceIndices.length && current; i++) {
    const sorted: PrismaChoice[] = [...current.choices].sort((a, b) => a.sortOrder - b.sortOrder);
    const chosen: PrismaChoice | undefined = sorted[choiceIndices[i]];

    result.push({ stepId: current.id, choiceId: chosen?.id ?? null });
    if (!chosen || chosen.isTerminal || !chosen.nextStepId) break;
    const rawNext: PrismaStep | undefined = steps.find((s) => s.id === chosen.nextStepId);
    current = rawNext ? autoFollowSingle(rawNext, steps) : undefined;
  }

  return result;
}

export async function GET() {
  try {
    const sessions = await prisma.troubleshootingSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        article: {
          include: {
            category: true,
            steps: { select: { id: true } },
          },
        },
        answers: {
          include: { step: true, choice: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Feil i GET /api/sessions:", error);
    return NextResponse.json({ error: "Kunne ikke hente sesjoner" }, { status: 500 });
  }
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

    const session = await prisma.troubleshootingSession.upsert({
      where: { sessionCode },
      create: {
        sessionCode,
        articleId: article.id,
        outcome: "IN_PROGRESS",
      },
      update: {},
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

    const resolvedSteps = await resolvePath(session.article.steps, payload.choices);

    // Save the customer's path as answers (idempotent via upsert)
    await Promise.all(
      resolvedSteps.map(({ stepId, choiceId }) =>
        prisma.sessionStepAnswer.upsert({
          where: { sessionId_stepId: { sessionId: session.id, stepId } },
          create: { sessionId: session.id, stepId, choiceId },
          update: { choiceId },
        })
      )
    );

    // Re-fetch to include the freshly saved answers
    const sessionWithAnswers = await prisma.troubleshootingSession.findUnique({
      where: { id: session.id },
      include: {
        article: { include: { category: true, deviceType: true } },
        answers: {
          include: { step: true, choice: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Resolve locale text for each answer
    const resolvedAnswers = await Promise.all(
      (sessionWithAnswers?.answers ?? []).map(async (a) => {
        const locale = await readLocale(a.step.localeKey);
        return {
          ...a,
          step: { ...a.step, title: locale?.title ?? a.step.title },
          body: locale?.body ?? null,
          choice: a.choice
            ? { ...a.choice, label: locale?.choices?.[a.choice.sortOrder]?.label ?? a.choice.label }
            : null,
        };
      })
    );

    return NextResponse.json({ ...sessionWithAnswers, answers: resolvedAnswers });
  } catch (error) {
    console.error("Feil i POST /api/sessions:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette sesjon" },
      { status: 500 }
    );
  }
}

