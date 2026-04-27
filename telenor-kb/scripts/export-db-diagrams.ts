import "dotenv/config";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type PrismaLike = {
  article: {
    findMany: Function;
  };
  $disconnect: Function;
};

type StepChoice = {
  id: string;
  label: string;
  sortOrder: number;
  nextStepId: string | null;
  terminalReason?: string | null;
};

type Step = {
  id: string;
  title: string;
  choices: StepChoice[];
};

type Article = {
  id: string;
  slug: string;
  title: string;
  category: { slug: string; name: string };
  deviceType: { slug: string; name: string };
  steps: Step[];
};

type LocaleStep = {
  stepToken?: string;
  title?: string;
  query?: string;
  body?: string;
  choices?: Array<{
    sortOrder?: number;
    label?: string;
    secondaryLabel?: string;
  }>;
};

let prisma: PrismaLike;

function normalizeToken(value: string): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseArticleSlug(slug: string): { category: string; routerPath: string } {
  const parts = slug.split("--");
  const category = parts.shift() || "";
  const routerPath = parts.join("/");
  return { category, routerPath };
}


async function listJsonFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json") && e.name !== "index.json")
    .map((e) => e.name)
    .sort();
}

async function loadLocaleIndex(localesRoot: string, articleSlug: string): Promise<Map<string, LocaleStep>> {
  const { category, routerPath } = parseArticleSlug(articleSlug);
  const index = new Map<string, LocaleStep>();

  const candidateDirs: string[] = [];
  if (category && routerPath) {
    candidateDirs.push(path.join(localesRoot, category, routerPath));
    candidateDirs.push(path.join(localesRoot, category, "shared"));
  }

  for (const dir of candidateDirs) {
    try {
      const files = await listJsonFiles(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const payload = JSON.parse(await readFile(fullPath, "utf-8")) as LocaleStep;
        const stepToken = payload.stepToken || file.replace(/\.json$/, "");
        const tokenKey = normalizeToken(stepToken);
        if (!index.has(tokenKey)) {
          index.set(tokenKey, payload);
        }
      }
    } catch {
      //Ignore
    }
  }

  return index;
}

function extractStepTokenFromKey(key: string, articleSlug: string): string {
  const { category, routerPath } = parseArticleSlug(articleSlug);
  const prefix = `${category}.${routerPath.replaceAll("/", ".")}.`;
  if (!key.startsWith(prefix)) return "";
  const rest = key.slice(prefix.length);

  const mTitle = rest.match(/^(.*)\.title$/);
  if (mTitle) return mTitle[1];

  const mBody = rest.match(/^(.*)\.body$/);
  if (mBody) return mBody[1];

  const mQuery = rest.match(/^(.*)\.query$/);
  if (mQuery) return mQuery[1];

  const mChoice = rest.match(/^(.*)\.choice_\d+\.(label|secondary)$/);
  if (mChoice) return mChoice[1];

  return "";
}

function resolveStepTitle(stepTitleKey: string, articleSlug: string, localeIndex: Map<string, LocaleStep>): string {
  const token = extractStepTokenFromKey(stepTitleKey, articleSlug);
  if (!token) return stepTitleKey;
  const localeStep = localeIndex.get(normalizeToken(token));
  return (localeStep?.title || "").trim() || stepTitleKey;
}

function resolveChoiceLabel(labelKey: string, articleSlug: string, localeIndex: Map<string, LocaleStep>): string {
  const { category, routerPath } = parseArticleSlug(articleSlug);
  const prefix = `${category}.${routerPath.replaceAll("/", ".")}.`;
  if (!labelKey.startsWith(prefix)) return labelKey;
  const rest = labelKey.slice(prefix.length);
  const match = rest.match(/^(.*)\.choice_(\d+)\.label$/);
  if (!match) return labelKey;

  const stepToken = match[1];
  const choiceIndex = Number(match[2]);
  const localeStep = localeIndex.get(normalizeToken(stepToken));
  if (!localeStep?.choices) return labelKey;

  let choice = localeStep.choices.find((c) => Number(c.sortOrder) === choiceIndex);
  if (!choice && choiceIndex >= 0 && choiceIndex < localeStep.choices.length) {
    choice = localeStep.choices[choiceIndex];
  }
  return (choice?.label || "").trim() || labelKey;
}

function mermaidSafe(text: string): string {
  return (text || "")
    .replaceAll("\n", " ")
    .replaceAll('"', "'")
    .trim();
}

function terminalReasonLabel(reason?: string | null): string {
  switch (reason) {
    case "EXTERNAL_REDIRECT":
      return "External Redirect";
    case "FLOW_EXIT_EXPECTED_SPEED":
      return "Expected Speed";
    case "FILTERED_CROSS_FLOW":
      return "Cross-Flow Handoff";
    case "FLOW_EXIT_NO_NEXT_STEP":
      return "No Next Step";
    default:
      return "Terminal";
  }
}

function nodeLabel(
  step: Step,
  articleSlug: string,
  localeIndex: Map<string, LocaleStep>,
): string {
  const resolved = resolveStepTitle(step.title, articleSlug, localeIndex);
  const title = mermaidSafe(resolved || "untitled");
  const shortId = step.id.slice(0, 8);
  return `${title}\\n(${shortId})`;
}

function buildFlowMermaid(
  article: Article,
  localeIndex: Map<string, LocaleStep>,
): string {
  const lines: string[] = [];
  const stepById = new Map(article.steps.map((s) => [s.id, s]));

  lines.push("flowchart TD");
  lines.push(`  classDef root fill:#dff3ff,stroke:#2a6f97,stroke-width:2px;`);
  lines.push(`  classDef terminal fill:#f6ead8,stroke:#8c5e2a,stroke-width:1px;`);

  for (const step of article.steps) {
    lines.push(`  S_${step.id}[\"${nodeLabel(step, article.slug, localeIndex)}\"]`);
  }

  const incoming = new Map<string, number>();
  for (const step of article.steps) incoming.set(step.id, 0);
  for (const step of article.steps) {
    for (const choice of step.choices) {
      if (choice.nextStepId && incoming.has(choice.nextStepId)) {
        incoming.set(choice.nextStepId, (incoming.get(choice.nextStepId) || 0) + 1);
      }
    }
  }

  for (const step of article.steps) {
    const ordered = [...step.choices].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const choice of ordered) {
      const resolvedLabel = resolveChoiceLabel(choice.label, article.slug, localeIndex);
      const label = mermaidSafe(resolvedLabel || `choice_${choice.sortOrder}`);
      if (choice.nextStepId && stepById.has(choice.nextStepId)) {
        lines.push(`  S_${step.id} -- \"${label}\" --> S_${choice.nextStepId}`);
      } else {
        const tNode = `T_${choice.id}`;
        const reason = terminalReasonLabel(choice.terminalReason);
        lines.push(`  ${tNode}[\"END: ${mermaidSafe(reason)}\\n(${choice.id.slice(0, 8)})\"]`);
        lines.push(`  S_${step.id} -- \"${label}\" --> ${tNode}`);
        lines.push(`  class ${tNode} terminal;`);
      }
    }
  }

  const roots = article.steps.filter((s) => (incoming.get(s.id) || 0) === 0);
  if (roots.length > 0) {
    lines.push(`  class ${roots.map((r) => `S_${r.id}`).join(",")} root;`);
  }

  return lines.join("\n") + "\n";
}

function buildSchemaMermaid(): string {
  return [
    "erDiagram",
    "  Category ||--o{ Article : has",
    "  DeviceType ||--o{ Article : scopes",
    "  Article ||--o{ Step : contains",
    "  Step ||--o{ StepChoice : has",
    "  Step ||--o{ StepChoice : incoming_links",
    "  TroubleshootingSession ||--o{ SessionStepAnswer : has",
    "  Step ||--o{ SessionStepAnswer : answered_in",
    "  StepChoice ||--o{ SessionStepAnswer : chosen_as",
    "  Article ||--o{ TroubleshootingSession : for",
    "  User {",
    "    string id PK",
    "    string email",
    "    enum role",
    "  }",
    "  Category {",
    "    string id PK",
    "    string slug UK",
    "    string name",
    "  }",
    "  DeviceType {",
    "    string id PK",
    "    string slug UK",
    "    string name",
    "  }",
    "  Article {",
    "    string id PK",
    "    string slug UK",
    "    string categoryId FK",
    "    string deviceTypeId FK",
    "  }",
    "  Step {",
    "    string id PK",
    "    string articleId FK",
    "    string title",
    "    string content",
    "  }",
    "  StepChoice {",
    "    string id PK",
    "    string stepId FK",
    "    string nextStepId FK",
    "    int sortOrder",
    "  }",
    "  TroubleshootingSession {",
    "    string id PK",
    "    string articleId FK",
    "    string sessionCode UK",
    "  }",
    "  SessionStepAnswer {",
    "    string id PK",
    "    string sessionId FK",
    "    string stepId FK",
    "    string choiceId FK",
    "  }",
    "",
  ].join("\n");
}

async function main() {
  const prismaClientPath = "../generated/prisma/client";
  const prismaModule = await import(prismaClientPath);
  const adapterModulePath = "@prisma/adapter-pg";
  const adapterModule = await import(adapterModulePath);
  const PrismaPg = adapterModule.PrismaPg as new (options: { connectionString: string }) => unknown;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it to telenor-kb/.env before exporting diagrams.");
  }

  prisma = new (prismaModule.PrismaClient as any)({
    adapter: new PrismaPg({ connectionString }),
  });

  const selectedSlugs = process.argv.slice(2);

  const articles = (await prisma.article.findMany({
    where: selectedSlugs.length > 0 ? { slug: { in: selectedSlugs } } : undefined,
    select: {
      id: true,
      slug: true,
      title: true,
      category: { select: { slug: true, name: true } },
      deviceType: { select: { slug: true, name: true } },
      steps: {
        select: {
          id: true,
          title: true,
          choices: {
            select: {
              id: true,
              label: true,
              sortOrder: true,
              nextStepId: true,
              terminalReason: true,
            },
          },
        },
      },
    },
    orderBy: { slug: "asc" },
  })) as Article[];

  const outRoot = path.resolve(process.cwd(), "visualizations");
  const outArticles = path.join(outRoot, "articles");
  await mkdir(outArticles, { recursive: true });

  await writeFile(path.join(outRoot, "schema-relations.mmd"), buildSchemaMermaid(), "utf-8");

  for (const article of articles) {
    const localeIndex = await loadLocaleIndex(path.resolve(process.cwd(), "public/locales"), article.slug);
    const flow = buildFlowMermaid(article, localeIndex);
    const file = path.join(outArticles, `${article.slug}.mmd`);
    await writeFile(file, flow, "utf-8");
  }

  console.log(`Wrote schema diagram: ${path.join(outRoot, "schema-relations.mmd")}`);
  console.log(`Wrote article diagrams: ${outArticles}`);
  console.log(`Total articles exported: ${articles.length}`);
}

main()
  .catch((error) => {
    console.error("Diagram export failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
