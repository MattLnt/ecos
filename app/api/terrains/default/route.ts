import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer le terrain par défaut
export async function GET() {
  try {
    // Récupérer le premier terrain (ou créer si n'existe pas)
    let court = await prisma.court.findFirst();

    if (!court) {
      // Créer terrain par défaut avec les 10 spots actuels
      court = await prisma.court.create({
        data: {
          name: 'Terrain ECOS',
          spotsConfig: JSON.stringify({
            spots: [
              { num: 1, x: 150, y: 150, label: 'AILE GAUCHE MID', sub: 'Mid-range gauche' },
              { num: 2, x: 450, y: 150, label: '0° MID — DROITE', sub: 'Mid-range droit' },
              { num: 3, x: 150, y: 450, label: 'CORNER GAUCHE 3PTS', sub: '3 points coin gauche' },
              { num: 4, x: 450, y: 450, label: 'CORNER DROIT 3PTS', sub: '3 points coin droit' },
              { num: 5, x: 300, y: 100, label: 'TOP KEY MID', sub: 'Haut de raquette' },
              { num: 6, x: 300, y: 500, label: 'BASELINE MID', sub: 'Ligne de fond' },
              { num: 7, x: 100, y: 300, label: 'AILE 45° 3PTS', sub: '3 points 45° gauche' },
              { num: 8, x: 500, y: 300, label: 'AILE 45° 3PTS', sub: '3 points 45° droit' },
              { num: 9, x: 300, y: 200, label: 'ELBOW GAUCHE', sub: 'Coude gauche' },
              { num: 10, x: 300, y: 400, label: 'ELBOW DROIT', sub: 'Coude droit' },
            ],
          }),
        },
      });
    }

    const spotsConfig = JSON.parse(court.spotsConfig);

    return NextResponse.json({
      id: court.id,
      name: court.name,
      spots: spotsConfig.spots,
    });
  } catch (error) {
    console.error('Erreur GET terrain:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour les positions
export async function PUT(request: Request) {
  try {
    const { spots } = await request.json();

    const court = await prisma.court.findFirst();
    if (!court) {
      return NextResponse.json({ error: 'Terrain introuvable' }, { status: 404 });
    }

    const updated = await prisma.court.update({
      where: { id: court.id },
      data: {
        spotsConfig: JSON.stringify({ spots }),
      },
    });

    const spotsConfig = JSON.parse(updated.spotsConfig);

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      spots: spotsConfig.spots,
    });
  } catch (error) {
    console.error('Erreur PUT terrain:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}