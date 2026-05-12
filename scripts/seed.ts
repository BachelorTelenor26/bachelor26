import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import "dotenv/config";

type Edge = {
  from: string;
  to: string;
  label: string;
  secondaryLabel: string;
  fromField: string;
};

type TerminalReason =
  | "SPEEDTEST"
  | "EXTERNAL_REDIRECT"
  | "FLOW_EXIT_EXPECTED_SPEED"
  | "FLOW_EXIT_NO_NEXT_STEP"
  | "FILTERED_CROSS_FLOW";

type FlowGraph = {
  edges: Array<{
    from: string;
    toUrl?: string;
    label?: string;
    secondaryLabel?: string;
    fromField?: string;
  }>;
};

type ComponentPayload = {
  id?: string;
  publishUrl?: string;
  content?: {
    stepHeader?: string;
    stepQuery?: string;
    stepBody?: string;
    stepContent?: Array<{
      stepBody?: string;
      stepImage?: {
        image_md?: { src?: string };
      };
    }>;
    stepImage?: {
      image_md?: { src?: string };
    };
  };
};

type PrismaLike = {
  category: {
    upsert: Function;
  };
  deviceType: {
    upsert: Function;
  };
  article: {
    upsert: Function;
  };
  step: {
    deleteMany: Function;
    create: Function;
  };
  stepChoice: {
    createMany: Function;
  };
  $disconnect: Function;
};

let prisma: PrismaLike;

function slugify(value: string): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replaceAll("å", "aa")
    .replaceAll("ø", "oe")
    .replaceAll("æ", "ae")
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";
}

function toTitleCaseFromSlug(slug: string): string {
  return slug
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractComponentKey(urlOrKey: string): string {
  if (!urlOrKey) return "";
  if (urlOrKey.includes("/")) {
    return urlOrKey.replace(/\/+$/, "").split("/").pop() || "";
  }
  return urlOrKey;
}

function deriveStepSlug(component: ComponentPayload, componentId: string): string {
  const publishUrl = (component.publishUrl || "").trim();
  if (publishUrl) {
    const filename = publishUrl.replace(/\/+$/, "").split("/").pop() || "";
    const noExt = filename.replace(/\.comp$/i, "");
    const fromPublish = slugify(noExt);
    if (fromPublish !== "unknown") return fromPublish;
  }

  const header = (component.content?.stepHeader || "").trim();
  const fromHeader = slugify(header);
  if (fromHeader !== "unknown") return fromHeader;

  return slugify(componentId);
}

function makeUniqueSlug(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (true) {
    const candidate = `${base}_v${i}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    i += 1;
  }
}

function getStepBody(component: ComponentPayload): string {
  const blocks = component.content?.stepContent || [];
  const parts: string[] = [];
  for (const block of blocks) {
    const body = (block.stepBody || "").trim();
    if (body) parts.push(body);
  }
  if (parts.length > 0) return parts.join("\n\n");
  return (component.content?.stepBody || "").trim();
}

function getImageUrl(component: ComponentPayload): string | null {
  for (const block of component.content?.stepContent || []) {
    const src = block.stepImage?.image_md?.src;
    if (src && src.trim()) return src.trim();
  }
  const fallback = component.content?.stepImage?.image_md?.src;
  return fallback?.trim() || null;
}

function normalizeEdges(graph: FlowGraph): { byFrom: Map<string, Edge[]>; edges: Edge[] } {
  const byFrom = new Map<string, Edge[]>();
  const edges: Edge[] = [];

  for (const raw of graph.edges || []) {
    const from = extractComponentKey(raw.from || "");
    const to = extractComponentKey(raw.toUrl || "");
    if (!from || !to) continue;

    const edge: Edge = {
      from,
      to,
      label: (raw.label || "").trim(),
      secondaryLabel: (raw.secondaryLabel || "").trim(),
      fromField: raw.fromField || "",
    };

    edges.push(edge);
    const list = byFrom.get(from) || [];
    list.push(edge);
    byFrom.set(from, list);
  }

  return { byFrom, edges };
}

function findStartNode(edges: Edge[]): string {
  const start = edges.find((e) => e.label.toLowerCase() === "start");
  if (start) return start.to;

  const incoming = new Set(edges.map((e) => e.to));
  const outgoing = new Set(edges.map((e) => e.from));
  const roots = [...outgoing].filter((node) => !incoming.has(node)).sort();
  return roots[0] || "";
}

function findRouterSplitNode(byFrom: Map<string, Edge[]>, edges: Edge[], startNode: string): string {
  if (!startNode) return "";

  const depth = new Map<string, number>();
  depth.set(startNode, 0);
  const queue: string[] = [startNode];

  while (queue.length > 0) {
    const node = queue.shift() as string;
    const d = depth.get(node) || 0;
    for (const edge of byFrom.get(node) || []) {
      if (!depth.has(edge.to)) {
        depth.set(edge.to, d + 1);
        queue.push(edge.to);
      }
    }
  }

  const productCounts = new Map<string, number>();
  for (const edge of edges) {
    if (edge.fromField.startsWith("productList")) {
      productCounts.set(edge.from, (productCounts.get(edge.from) || 0) + 1);
    }
  }

  const candidates = [...productCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([node]) => node)
    .sort((a, b) => {
      const da = depth.get(a) ?? Number.MAX_SAFE_INTEGER;
      const db = depth.get(b) ?? Number.MAX_SAFE_INTEGER;
      return da - db || a.localeCompare(b);
    });

  return candidates[0] || startNode;
}

function getPreRouterGroup(byFrom: Map<string, Edge[]>, startNode: string, splitNode: string): string {
  if (!startNode || !splitNode || startNode === splitNode) return "";

  const queue: string[] = [startNode];
  const seen = new Set<string>([startNode]);
  const parent = new Map<string, { node: string; label: string }>();

  while (queue.length > 0) {
    const node = queue.shift() as string;
    if (node === splitNode) break;

    for (const edge of byFrom.get(node) || []) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      parent.set(edge.to, { node, label: edge.label });
      queue.push(edge.to);
    }
  }

  const incoming = parent.get(splitNode);
  return incoming ? slugify(incoming.label) : "";
}

function inferTerminalReason(args: {
  nextStepId: string | null;
  rawTargetId: string;
  selectedNodeIds: Set<string>;
  knownOwners: Map<string, string>;
  stepTitleKey: string;
  choiceLabel: string;
}): TerminalReason | null {
  if (args.nextStepId) return null;

  const label = (args.choiceLabel || "").trim().toLowerCase();
  const titleKey = (args.stepTitleKey || "").toLowerCase();

  if (label === "speedometer") {
    return "SPEEDTEST";
  }

  if (label === "mine sider" || label.includes("koble til wifi")) {
    return "EXTERNAL_REDIRECT";
  }

  if (label === "ja" && (titleKey.includes("hastighet") || titleKey.includes("speed"))) {
    return "FLOW_EXIT_EXPECTED_SPEED";
  }

  if (args.rawTargetId && args.knownOwners.has(args.rawTargetId) && !args.selectedNodeIds.has(args.rawTargetId)) {
    return "FILTERED_CROSS_FLOW";
  }

  return "FLOW_EXIT_NO_NEXT_STEP";
}

function inferRouterOwnership(byFrom: Map<string, Edge[]>, edges: Edge[], startNode: string): {
  ownership: Map<string, string>;
  splitNode: string;
  preRouterGroup: string;
  routerBaseByOwner: Map<string, string>;
} {
  const ownership = new Map<string, string>();
  const splitNode = findRouterSplitNode(byFrom, edges, startNode);
  const preRouterGroup = getPreRouterGroup(byFrom, startNode, splitNode);
  const routerBaseByOwner = new Map<string, string>();

  const outgoing = byFrom.get(splitNode) || [];
  const routerEdges = outgoing.filter((e) => e.fromField.startsWith("productList"));
  const bases = (routerEdges.length > 0 ? routerEdges : outgoing).map((e) => ({
    node: e.to,
    router: slugify(e.label || "shared"),
  }));

  for (const base of bases) {
    if (base.router !== "shared" && !routerBaseByOwner.has(base.router)) {
      routerBaseByOwner.set(base.router, base.node);
    }
  }

  for (const base of bases) {
    const queue: string[] = [base.node];
    const seen = new Set<string>();

    while (queue.length > 0) {
      const node = queue.shift() as string;
      if (seen.has(node)) continue;
      seen.add(node);

      const existing = ownership.get(node);
      if (!existing) ownership.set(node, base.router);
      else if (existing !== base.router) ownership.set(node, "shared");

      for (const edge of byFrom.get(node) || []) {
        queue.push(edge.to);
      }
    }
  }

  if (startNode) ownership.set(startNode, "shared");
  if (splitNode) ownership.set(splitNode, "shared");

  return { ownership, splitNode, preRouterGroup, routerBaseByOwner };
}

function buildParentMapFromStart(byFrom: Map<string, Edge[]>, startNode: string): Map<string, string> {
  const parent = new Map<string, string>();
  if (!startNode) return parent;

  const queue: string[] = [startNode];
  const seen = new Set<string>([startNode]);

  while (queue.length > 0) {
    const node = queue.shift() as string;
    for (const edge of byFrom.get(node) || []) {
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      parent.set(edge.to, node);
      queue.push(edge.to);
    }
  }

  return parent;
}

function pathFromStartToNode(parent: Map<string, string>, startNode: string, targetNode: string): string[] {
  if (!startNode || !targetNode) return [];
  if (startNode === targetNode) return [startNode];

  const rev: string[] = [targetNode];
  let cur = targetNode;
  while (cur !== startNode) {
    const p = parent.get(cur);
    if (!p) return [];
    rev.push(p);
    cur = p;
  }
  rev.reverse();
  return rev;
}

function connectedNodesForRouter(
  byFrom: Map<string, Edge[]>,
  ownership: Map<string, string>,
  startNode: string,
  baseNode: string,
  routerOwner: string,
): Set<string> {
  const allowedOwners = new Set<string>(["shared", routerOwner]);
  const selected = new Set<string>();

  const parent = buildParentMapFromStart(byFrom, startNode);
  const trunk = pathFromStartToNode(parent, startNode, baseNode);
  for (const node of trunk) {
    const owner = ownership.get(node) || "shared";
    if (allowedOwners.has(owner)) selected.add(node);
  }

  const queue: string[] = baseNode ? [baseNode] : [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift() as string;
    if (seen.has(node)) continue;
    seen.add(node);

    const owner = ownership.get(node) || "shared";
    if (!allowedOwners.has(owner)) continue;
    selected.add(node);

    for (const edge of byFrom.get(node) || []) {
      queue.push(edge.to);
    }
  }

  return selected;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function listComponentFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort();
}

async function upsertCategory(categorySlug: string) {
  return prisma.category.upsert({
    where: { slug: categorySlug },
    create: {
      slug: categorySlug,
      name: toTitleCaseFromSlug(categorySlug),
    },
    update: {
      name: toTitleCaseFromSlug(categorySlug),
    },
  });
}

async function upsertDeviceType(routerLeafSlug: string) {
  return prisma.deviceType.upsert({
    where: { slug: routerLeafSlug },
    create: {
      slug: routerLeafSlug,
      name: toTitleCaseFromSlug(routerLeafSlug),
    },
    update: {
      name: toTitleCaseFromSlug(routerLeafSlug),
    },
  });
}

async function upsertArticle(categorySlug: string, routerPath: string, categoryId: string, deviceTypeId: string) {
  const articleSlug = slugify(`${categorySlug}--${routerPath.replaceAll("/", "--")}`);
  const articleTitle = `${toTitleCaseFromSlug(categorySlug)} - ${toTitleCaseFromSlug(routerPath)}`;

  return prisma.article.upsert({
    where: { slug: articleSlug },
    create: {
      slug: articleSlug,
      title: articleTitle,
      categoryId,
      deviceTypeId,
      keywords: [categorySlug, routerPath],
    },
    update: {
      title: articleTitle,
      categoryId,
      deviceTypeId,
      keywords: [categorySlug, routerPath],
    },
  });
}

async function importCategory(guidesRoot: string, categorySlug: string) {
  let flowPath = path.join(guidesRoot, `${categorySlug}_flow_graph.json`);
  try { await readFile(flowPath); } catch {
    flowPath = path.join(guidesRoot, `${categorySlug}.json`);
  }
  const componentsDir = path.join(guidesRoot, categorySlug);

  const graph = await readJson<FlowGraph>(flowPath);
  const { byFrom, edges } = normalizeEdges(graph);

  const componentFiles = await listComponentFiles(componentsDir);
  const components = new Map<string, ComponentPayload>();

  for (const file of componentFiles) {
    const payload = await readJson<ComponentPayload>(path.join(componentsDir, file));
    const id = String(payload.id || file.replace(/\.json$/, ""));
    components.set(id, payload);
  }

  const startNode = findStartNode(edges);
  const { ownership, preRouterGroup, routerBaseByOwner } = inferRouterOwnership(byFrom, edges, startNode);

  const routerPaths = new Set<string>();
  for (const router of ownership.values()) {
    if (router === "shared") continue;
    if (preRouterGroup) routerPaths.add(`${preRouterGroup}/${router}`);
    else routerPaths.add(router);
  }

  const category = await upsertCategory(categorySlug);

  for (const routerPath of [...routerPaths].sort()) {
    const leaf = routerPath.split("/").pop() || routerPath;
    const deviceType = await upsertDeviceType(leaf);
    const article = await upsertArticle(categorySlug, routerPath, category.id, deviceType.id);

    const routerOwner = preRouterGroup ? routerPath.split("/").pop() || routerPath : routerPath;
    const baseNode = routerBaseByOwner.get(routerOwner) || "";
    const selectedNodeIds = connectedNodesForRouter(byFrom, ownership, startNode, baseNode, routerOwner);

    await prisma.step.deleteMany({ where: { articleId: article.id } });

    const componentToStepId = new Map<string, string>();
    const baseKeyByComponent = new Map<string, string>();
    const usedStepSlugs = new Set<string>();

    for (const componentId of [...selectedNodeIds].sort()) {
      const component = components.get(componentId);
      if (!component) continue;

      const stepSlug = makeUniqueSlug(deriveStepSlug(component, componentId), usedStepSlugs);
      const componentOwner = ownership.get(componentId) || "shared";
      const localeFolder = componentOwner === "shared"
        ? `${categorySlug}/shared`
        : `${categorySlug}/${routerPath}`;
      const keySegment = componentOwner === "shared"
        ? `${categorySlug}.shared`
        : `${categorySlug}.${routerPath.replaceAll("/", ".")}`;
      const keyBase = `${keySegment}.${stepSlug}`;
      baseKeyByComponent.set(componentId, keyBase);

      const titleKey = `${keyBase}.title`;
      const localeFilePath = `${localeFolder}/${stepSlug}`;

      const created = await prisma.step.create({
        data: {
          title: titleKey,
          localeKey: localeFilePath,
          imageUrl: getImageUrl(component),
          articleId: article.id,
        },
        select: { id: true },
      });

      componentToStepId.set(componentId, created.id);
    }

    for (const componentId of [...selectedNodeIds].sort()) {
      const stepId = componentToStepId.get(componentId);
      if (!stepId) continue;

      const allowedOwners = new Set<string>(["shared", routerOwner]);
      const outgoing = (byFrom.get(componentId) || []).filter((edge) => {
        const targetOwner = ownership.get(edge.to);

        if (targetOwner && !allowedOwners.has(targetOwner)) {
          return false;
        }
        return true;
      });
      const keyBase = baseKeyByComponent.get(componentId) || `${categorySlug}.${routerPath}.step`;

      const rows = outgoing.map((edge, idx) => {
        const nextStepId = selectedNodeIds.has(edge.to) ? (componentToStepId.get(edge.to) ?? null) : null;
        const labelKey = `${keyBase}.choice_${idx}.label`;
        const secondaryKey = edge.secondaryLabel ? `${keyBase}.choice_${idx}.secondary` : null;
        const terminalReason = inferTerminalReason({
          nextStepId,
          rawTargetId: edge.to,
          selectedNodeIds,
          knownOwners: ownership,
          stepTitleKey: keyBase,
          choiceLabel: edge.label,
        });

        return {
          stepId,
          label: labelKey,
          buttonText: secondaryKey,
          value: edge.fromField || null,
          nextStepId,
          sortOrder: idx,
          isTerminal: nextStepId === null,
          terminalReason,
        };
      });

      if (rows.length > 0) {
        await prisma.stepChoice.createMany({ data: rows });
      }
    }

    console.log(`Imported ${categorySlug}/${routerPath}: article=${article.slug}, nodes=${selectedNodeIds.size}`);
  }
}

async function main() {
  const prismaClientPath = "../prisma/generated/prisma/client";
  const prismaModule = await import(prismaClientPath);
  const adapterModulePath = "@prisma/adapter-pg";
  const adapterModule = await import(adapterModulePath);
  const RuntimePrismaClient = prismaModule.PrismaClient as new () => PrismaLike;
  const PrismaPg = adapterModule.PrismaPg as new (options: { connectionString: string }) => unknown;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it to telenor-kb/.env before running import.");
  }

  prisma = new (prismaModule.PrismaClient as any)({
    adapter: new PrismaPg({ connectionString }),
  });

  const guidesRoot = path.resolve(process.cwd(), "telenor-guides");
  const selectedCategories = process.argv.slice(2);
  const categories = selectedCategories.length > 0 ? selectedCategories : ["ikke-pa-nett", "tregt-nett", "ustabilt-nett"];

  for (const category of categories) {
    await importCategory(guidesRoot, category);
  }

  console.log("Scraped -> Prisma import finished.");
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
