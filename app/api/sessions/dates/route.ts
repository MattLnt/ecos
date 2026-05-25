import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { status: 'completed' },
      select: {
        id: true,
        date: true,
        startedAt: true,
        sessionPlayers: {
          select: { totalPoints: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Grouper les sessions par jour (YYYY-MM-DD)
    const byDay: Record<string, { sessionId: string; time: string; playerCount: number }[]> = {};

    sessions.forEach((s) => {
      const d = new Date(s.date);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!byDay[dayKey]) byDay[dayKey] = [];

      byDay[dayKey].push({
        sessionId: s.id,
        time: new Date(s.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        playerCount: s.sessionPlayers.length,
      });
    });

    return NextResponse.json(byDay);
  } catch (error) {
    console.error('Erreur GET sessions dates:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}