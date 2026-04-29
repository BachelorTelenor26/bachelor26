import { prisma } from "@/lib/prisma";  
import { NextResponse } from "next/server"; 


export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        deviceType: true,
        steps: {
          include: {
            choices: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Artikkel ikke funnet' },
        { status: 404 }
      )
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error("Feil i GET /api/articles/[slug]:", error);
    return NextResponse.json(
      { error: 'Kunne ikke hente artikkel' },
      { status: 500 }
    )
  }
}