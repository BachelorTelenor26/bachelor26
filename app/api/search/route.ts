import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";

  if (!q) {
    return Response.json({
      tickets: [],
      customers: [],
      articles: [],
    });
  }

  const [ customers, articles] = await Promise.all([
    

    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    }),

    prisma.article.findMany({
      where: {
        title: {
          contains: q,
          mode: "insensitive",
        },
      },
      take: 10,
    }),
  ]);

  return Response.json({
    customers,
    articles,
  });
}