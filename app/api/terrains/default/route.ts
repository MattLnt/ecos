import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer le terrain par défaut
export async function GET() {
  try {
    // Récupérer le premier terrain (ou créer si n'existe pas)
    let court = await prisma.court.findFirst();

    if (!court) {
      // Créer terrain par défaut avec les 10 spots officiels NBA
      court = await prisma.court.create({
        data: {
          name: 'Terrain ECOS',
          isDefault: true,
          spotsConfig: [
            { id: 'b-r',  num: 1,  label: '0° MID',     sub: 'DROITE', x: 38.5, y: 6.5,  zone: 'mid' },
            { id: 'c-r',  num: 2,  label: '0° 3 PTS',   sub: 'DROITE', x: 48.2, y: 4.0,  zone: '3pt' },
            { id: 'el-r', num: 3,  label: '45° MID',    sub: 'DROITE', x: 36.5, y: 17.0, zone: 'mid' },
            { id: 'w-r',  num: 4,  label: '45° 3 PTS',  sub: 'DROITE', x: 40.5, y: 24.5, zone: '3pt' },
            { id: 'ft',   num: 5,  label: 'LANCER FRANC', sub: '15 FT', x: 23.5, y: 19.5, zone: 'mid' },
            { id: 'top',  num: 6,  label: '90° 3 PTS',  sub: 'CENTRE', x: 25,   y: 30.4, zone: '3pt' },
            { id: 'el-l', num: 7,  label: '45° MID',    sub: 'GAUCHE', x: 13.5, y: 17.0, zone: 'mid' },
            { id: 'w-l',  num: 8,  label: '45° 3 PTS',  sub: 'GAUCHE', x: 9.5,  y: 24.5, zone: '3pt' },
            { id: 'b-l',  num: 9,  label: '0° MID',     sub: 'GAUCHE', x: 11.5, y: 6.5,  zone: 'mid' },
            { id: 'c-l',  num: 10, label: '0° 3 PTS',   sub: 'GAUCHE', x: 1.8,  y: 4.0,  zone: '3pt' },
          ],
        },
      });
    }

    return NextResponse.json({
      id: court.id,
      name: court.name,
      spots: court.spotsConfig,
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
        spotsConfig: spots,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      spots: updated.spotsConfig,
    });
  } catch (error) {
    console.error('Erreur PUT terrain:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}