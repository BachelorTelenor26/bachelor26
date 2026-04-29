import { prisma } from "@/lib/prisma";  
import { NextResponse } from "next/server"; 

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Feil i GET /api/categories:", error);

    return NextResponse.json(
      { error: 'Kunne ikke hente kategorier' },
      { status: 500 }
    )
  }
}