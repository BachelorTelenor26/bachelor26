import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import TroubleshootingFlow, { ArticleWithLocales } from "@/app/components/kunde/TroubleshootingFlow";

type Props = {
  params: Promise<{ id: string; articleSlug: string }>;
};

async function readLocale(localeKey: string): Promise<Record<string, unknown> | null> {
  try {
    const file = path.join(process.cwd(), "public", "locales", `${localeKey}.json`);
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id: categorySlug, articleSlug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    include: {
      category: true,
      deviceType: true,
      steps: {
        include: { choices: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!article || article.category.slug !== categorySlug) notFound();

  const localeMap: Record<string, unknown> = {};
  for (const step of article.steps) {
    const data = await readLocale(step.localeKey);
    if (data) localeMap[step.id] = data;
  }

  const articleWithLocales: ArticleWithLocales = { ...article, localeMap };

  return (
    <TroubleshootingFlow
      article={articleWithLocales}
      categoryName={article.category.name}
      categorySlug={article.category.slug}
    />
  );
}
