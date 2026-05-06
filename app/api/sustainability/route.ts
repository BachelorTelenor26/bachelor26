import { NextResponse } from 'next/server'
import { getSustainabilityData } from '@/lib/sustainability'

export async function GET() {
  try {
    const data = await getSustainabilityData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Feil i GET /api/sustainability:', error)
    return NextResponse.json(
      { error: 'Kunne ikke hente baerekraftsdata' },
      { status: 500 }
    )
  }
}