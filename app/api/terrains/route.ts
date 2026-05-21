import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Liste tous les terrains
export async function GET() {
  try {
    const courts = await prisma.court.findMany({
      orderBy: { isDefault: 'desc' },
    });
    return NextResponse.json(courts);
  } catch (error) {
    console.error('Erreur GET terrains:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}