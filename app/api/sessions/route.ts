import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { decodeHandoverCode, deriveFlowId } from "@/app/lib/sessionCode";
import { auth } from "@/lib/auth";

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

function resolvePath(
  steps: PrismaStep[],
  choiceIndices: number[]
): Array<{ stepId: string; choiceId: string | null }> {
  const root = findRootStep(steps);
  if (!root) return [];

  const stepsById = new Map(steps.map((s) => [s.id, s]));
  const result: Array<{ stepId: string; choiceId: string | null }> = [];
  let current: PrismaStep | undefined = autoFollowSingle(root, steps);

  for (const index of choiceIndices) {
    if (!current) break;

    const sorted = [...current.choices].sort((a, b) => a.sortOrder - b.sortOrder);
    const chosen: PrismaChoice | undefined = sorted[index];

    result.push({ stepId: current.id, choiceId: chosen?.id ?? null });

    if (!chosen || chosen.isTerminal || !chosen.nextStepId) break;

    const next = stepsById.get(chosen.nextStepId);
    current = next ? autoFollowSingle(next, steps) : undefined;
  }

  return result;
}

export async function GET() {
  try {
    const sessions = await prisma.troubleshootingSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
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
    const articleSlug =
      typeof body?.articleSlug === "string" ? (body.articleSlug as string).trim() : null;
    const deviceTypeSlug =
      typeof body?.deviceTypeSlug === "string" ? (body.deviceTypeSlug as string).trim() : null;
    const rawChoiceIndices = Array.isArray(body?.choiceIndices) ? body.choiceIndices : null;
    const choiceIndices = rawChoiceIndices
      ? rawChoiceIndices
          .filter((value: unknown) => Number.isInteger(value) && Number(value) >= 0)
          .map((value: number) => Number(value))
      : [];

    let resolvedArticleId: string | null = null;
    let resolvedFromCodeChoiceIndices: number[] = [];
    let origin: "customer" | "customerService" = "customer";

    if (sessionCode) {
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

      resolvedArticleId = article.id;
      resolvedFromCodeChoiceIndices = payload.choices;
      origin = "customer";
    } else {
      const authSession = await auth.api.getSession({ headers: request.headers });
      if (!authSession?.user) {
        return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
      }

      if (articleSlug) {
        const article = await prisma.article.findUnique({
          where: { slug: articleSlug },
          select: { id: true },
        });
        if (!article) {
          return NextResponse.json({ error: "Fant ingen guide" }, { status: 404 });
        }
        resolvedArticleId = article.id;
      } else if (deviceTypeSlug) {
        const article = await prisma.article.findFirst({
          where: {
            deviceType: {
              slug: deviceTypeSlug,
            },
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        });
        if (!article) {
          return NextResponse.json({ error: "Fant ingen guide for valgt enhet" }, { status: 404 });
        }
        resolvedArticleId = article.id;
      } else {
        return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
      }

      origin = "customerService";
    }

    if (!resolvedArticleId) {
      return NextResponse.json({ error: "Kunne ikke finne guide" }, { status: 400 });
    }

    const session = await prisma.troubleshootingSession.create({
      data: {
        ...(sessionCode ? { sessionCode } : {}),
        articleId: resolvedArticleId,
        outcome: "IN_PROGRESS",
        origin,
      },
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

    const pathChoiceIndices = sessionCode ? resolvedFromCodeChoiceIndices : choiceIndices;
    const resolvedSteps = resolvePath(session.article.steps, pathChoiceIndices);

    for (const { stepId, choiceId } of resolvedSteps) {
      await prisma.sessionStepAnswer.upsert({
        where: { sessionId_stepId: { sessionId: session.id, stepId } },
        create: { sessionId: session.id, stepId, choiceId },
        update: { choiceId },
      });
    }

    const sessionWithAnswers = await prisma.troubleshootingSession.findUnique({
      where: { id: session.id },
      include: {
        article: { include: { category: true, deviceType: true } },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        answers: {
          include: { step: true, choice: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

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

