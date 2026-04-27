import process from "node:process";
import "dotenv/config";

type PrismaLike = {
  article: {
    findMany: Function;
  };
  $disconnect: Function;
};

type DbChoice = {
  id: string;
  stepId: string;
  nextStepId: string | null;
  sortOrder: number;
  isTerminal: boolean;
  label: string;
};

type DbStep = {
  id: string;
  title: string;
  articleId: string;
  choices: DbChoice[];
  incomingLinks: Array<{ id: string; stepId: string }>;
};

type DbArticle = {
  id: string;
  slug: string;
  title: string;
  steps: DbStep[];
};

let prisma: PrismaLike;

function walkReachable(
  roots: string[],
  stepById: Map<string, DbStep>,
): Set<string> {
  const visited = new Set<string>();
  const stack = [...roots];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (visited.has(current)) continue;
    visited.add(current);

    const step = stepById.get(current);
    if (!step) continue;

    for (const choice of step.choices) {
      if (choice.nextStepId && !visited.has(choice.nextStepId)) {
        stack.push(choice.nextStepId);
      }
    }
  }

  return visited;
}

async function validateArticle(article: DbArticle) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (article.steps.length === 0) {
    errors.push("No steps in article");
    return { errors, warnings, stats: { steps: 0, choices: 0, roots: 0, unreachable: 0 } };
  }

  const stepById = new Map(article.steps.map((s) => [s.id, s]));

  let choiceCount = 0;
  const incomingCount = new Map<string, number>();
  for (const step of article.steps) {
    incomingCount.set(step.id, 0);
  }

  // Validate choice links and terminal flags
  for (const step of article.steps) {
    const sortOrders = new Set<number>();

    for (const choice of step.choices) {
      choiceCount += 1;

      if (sortOrders.has(choice.sortOrder)) {
        errors.push(`Duplicate sortOrder=${choice.sortOrder} on step=${step.id}`);
      }
      sortOrders.add(choice.sortOrder);

      if (choice.nextStepId) {
        const target = stepById.get(choice.nextStepId);
        if (!target) {
          errors.push(`Broken nextStepId reference from choice=${choice.id} -> ${choice.nextStepId}`);
        } else {
          incomingCount.set(choice.nextStepId, (incomingCount.get(choice.nextStepId) || 0) + 1);
        }
        if (choice.isTerminal) {
          warnings.push(`Choice marked terminal but has nextStepId: choice=${choice.id}`);
        }
      } else if (!choice.isTerminal) {
        warnings.push(`Choice has null nextStepId but isTerminal=false: choice=${choice.id}`);
      }
    }
  }

  // Roots = steps with no incoming edges
  const roots = [...incomingCount.entries()]
    .filter(([, count]) => count === 0)
    .map(([id]) => id);

  if (roots.length === 0) {
    errors.push("No root step found (graph may be cyclic/disconnected)");
  } else if (roots.length > 1) {
    warnings.push(`Multiple roots found (${roots.length})`);
  }

  const reachable = walkReachable(roots, stepById);
  const unreachable = article.steps.filter((s) => !reachable.has(s.id));
  if (unreachable.length > 0) {
    warnings.push(`Unreachable steps: ${unreachable.length}`);
  }

  return {
    errors,
    warnings,
    stats: {
      steps: article.steps.length,
      choices: choiceCount,
      roots: roots.length,
      unreachable: unreachable.length,
    },
  };
}

async function main() {
  const prismaClientPath = "../generated/prisma/client";
  const prismaModule = await import(prismaClientPath);
  const adapterModule = await import("@prisma/adapter-pg");
  const PrismaPg = adapterModule.PrismaPg as new (options: { connectionString: string }) => unknown;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it to telenor-kb/.env before running validation.");
  }

  prisma = new (prismaModule.PrismaClient as any)({
    adapter: new PrismaPg({ connectionString }),
  });

  const filter = process.argv.slice(2);

  const articles = (await prisma.article.findMany({
    where: filter.length > 0 ? { slug: { in: filter } } : undefined,
    select: {
      id: true,
      slug: true,
      title: true,
      steps: {
        select: {
          id: true,
          title: true,
          articleId: true,
          incomingLinks: {
            select: {
              id: true,
              stepId: true,
            },
          },
          choices: {
            select: {
              id: true,
              stepId: true,
              nextStepId: true,
              sortOrder: true,
              isTerminal: true,
              label: true,
            },
          },
        },
      },
    },
  })) as DbArticle[];

  if (articles.length === 0) {
    console.log("No articles found to validate.");
    return;
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  console.log(`Validating ${articles.length} article(s) ...`);

  for (const article of articles) {
    const result = await validateArticle(article);

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    const status = result.errors.length > 0 ? "FAIL" : result.warnings.length > 0 ? "WARN" : "OK";

    console.log(
      `[${status}] ${article.slug} | steps=${result.stats.steps} choices=${result.stats.choices} roots=${result.stats.roots} unreachable=${result.stats.unreachable}`,
    );

    for (const err of result.errors) {
      console.log(`  ERROR: ${err}`);
    }
    for (const warn of result.warnings) {
      console.log(`  WARN:  ${warn}`);
    }
  }

  console.log("\nSummary:");
  console.log(`  Articles: ${articles.length}`);
  console.log(`  Errors:   ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error("Validation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
