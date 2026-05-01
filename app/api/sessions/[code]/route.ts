import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { code } = await params

    const session = await prisma.troubleshootingSession.findFirst({
      where: {
        OR: [
          { sessionCode: code },
          { id: code }
        ]
      },
      include: {
        article: {
          include: {
            category: true,
            deviceType: true,
          }
        },
        answers: {
          include: {
            step: true,
            choice: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesjon ikke funnet' },
        { status: 404 }
      )
    }

    // Hent neste steg basert på siste svar
    const lastAnswer = session.answers[session.answers.length - 1]
    const nextStep = lastAnswer?.choice?.nextStepId
      ? await prisma.step.findUnique({
          where: { id: lastAnswer.choice.nextStepId }
        })
      : null

    return NextResponse.json({ ...session, nextStep })
  } catch (error) {
    console.error('Feil i GET /api/sessions/[code]:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente sesjon' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { code } = await params
    const body = await request.json()
    const { outcome, completed, escalationReason } = body

    const session = await prisma.troubleshootingSession.update({
      where: { sessionCode: code },
      data: {
        ...(outcome && { outcome }),
        ...(completed !== undefined && { completed }),
        ...(escalationReason && { escalationReason }),
      },
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Feil i PATCH /api/sessions/[code]:', error)
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere sesjon' },
      { status: 500 }
    )
  }
}