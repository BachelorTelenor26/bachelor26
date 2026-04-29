import { prisma } from "@/lib/prisma";  
import { NextResponse } from "next/server"; 
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { articleId, routerModel } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId er påkrevd' },
        { status: 400 }
      )
    }

    // Sjekk at artikkelen finnes
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Artikkel ikke funnet' },
        { status: 404 }
      )
    }

    const session = await prisma.troubleshootingSession.create({
      data: {
        sessionCode: randomBytes(4).toString('hex').toUpperCase(),
        articleId,
        routerModel: routerModel ?? null,
      },
      include: {
        article: {
          include: { category: true, deviceType: true }
        }
      }
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error("Feil i GET /api/sessions:", error);
    return NextResponse.json(
      { error: 'Kunne ikke opprette sesjon' },
      { status: 500 }
    )
  }
}