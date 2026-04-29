import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        deviceType: true,
        steps: {
          include: {
            choices: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Artikkel ikke funnet" },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Feil i GET /api/articles/[slug]:", error);

    return NextResponse.json(
      { error: "Kunne ikke hente artikkel" },
      { status: 500 }
    );
  }
}