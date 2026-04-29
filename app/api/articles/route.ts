import { prisma } from "@/lib/prisma";  
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const deviceTypeSlug = searchParams.get('device')
    const search = searchParams.get('q')

    const articles = await prisma.article.findMany({
      where: {
        ...(categorySlug && {
          category: { slug: categorySlug }
        }),
        ...(deviceTypeSlug && {
          deviceType: { slug: deviceTypeSlug }
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { ingress: { contains: search, mode: 'insensitive' } },
            { keywords: { has: search } }
          ]
        })
      },
      include: {
        category: true,
        deviceType: true,
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(articles)
  }catch (error) {
    console.error("Feil i GET /api/articles:", error);
    return NextResponse.json(
      { error: 'Kunne ikke hente artikler' },
      { status: 500 }
    )
  }
}