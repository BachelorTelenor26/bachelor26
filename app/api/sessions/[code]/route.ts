import { prisma } from "@/lib/prisma";  
import { NextResponse } from "next/server"; 


export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const session = await prisma.troubleshootingSession.findUnique({
      where: { sessionCode: params.code },
      include: {
        article: {
          include: { category: true, deviceType: true }
        },
        answers: {
          include: {
            step: true,
            choice: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesjon ikke funnet' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch {
    return NextResponse.json(
      { error: 'Kunne ikke hente sesjon' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json()
    const { outcome, completed, escalationReason } = body

    const session = await prisma.troubleshootingSession.update({
      where: { sessionCode: params.code },
      data: {
        ...(outcome && { outcome }),
        ...(completed !== undefined && { completed }),
        ...(escalationReason && { escalationReason }),
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error("Feil i GET /api/sessions/[code]:", error);
    return NextResponse.json(
      { error: 'Kunne ikke oppdatere sesjon' },
      { status: 500 }
    )
  }
}