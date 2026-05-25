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
      orderBy: { startedAt: 'asc' }, // ← tri chronologique croissant
    });

    // Grouper les sessions par jour (YYYY-MM-DD) en fuseau Europe/Paris
    const byDay: Record<string, { sessionId: string; time: string; startedAt: string; playerCount: number }[]> = {};

    sessions.forEach((s) => {
      const d = new Date(s.startedAt);

      // Clé du jour en fuseau Paris
      const dayKey = d.toLocaleDateString('fr-CA', {
        timeZone: 'Europe/Paris',
      }); // fr-CA donne le format YYYY-MM-DD

      if (!byDay[dayKey]) byDay[dayKey] = [];

      byDay[dayKey].push({
        sessionId: s.id,
        // Heure en fuseau Paris (corrige le décalage UTC)
        time: d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris',
        }),
        startedAt: s.startedAt.toISOString(),
        playerCount: s.sessionPlayers.length,
      });
    });

    // S'assurer que chaque jour est trié par heure croissante
    Object.keys(byDay).forEach((day) => {
      byDay[day].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    });

    return NextResponse.json(byDay);
  } catch (error) {
    console.error('Erreur GET sessions dates:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}