import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeviceSelectorPage from "@/app/components/kunde/DeviceSelectorPage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FeilsokingPage({ params }: Props) {
  const { id: categorySlug } = await params;

  const articles = await prisma.article.findMany({
    where: { category: { slug: categorySlug } },
    include: { category: true, deviceType: true },
    orderBy: { deviceType: { name: "asc" } },
  });

  if (!articles.length) notFound();

  const category = articles[0].category;

  return (
    <DeviceSelectorPage
      categoryName={category.name}
      categorySlug={category.slug}
      articles={articles.map((a) => ({
        slug: a.slug,
        deviceType: {
          name: a.deviceType.name,
          slug: a.deviceType.slug,
          description: a.deviceType.description,
        },
      }))}
    />
  );
}
