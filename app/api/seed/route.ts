import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SPOTS = [
  { id: 'b-r',  num: 1,  label: '0° MID',     sub: 'DROITE', x: 38.5, y: 6.5,  zone: 'mid' },
  { id: 'c-r',  num: 2,  label: '0° 3 PTS',   sub: 'DROITE', x: 48.2, y: 4.0,  zone: '3pt' },
  { id: 'el-r', num: 3,  label: '45° MID',    sub: 'DROITE', x: 36.5, y: 17.0, zone: 'mid' },
  { id: 'w-r',  num: 4,  label: '45° 3 PTS',  sub: 'DROITE', x: 40.5, y: 24.5, zone: '3pt' },
  { id: 'ft',   num: 5,  label: 'LANCER FRANC', sub: 'GAUCHE DROITE', x: 23.5, y: 19.5, zone: 'mid' },
  { id: 'top',  num: 6,  label: 'FACE 3 PTS',  sub: 'CENTRE', x: 25,   y: 30.4, zone: '3pt' },
  { id: 'el-l', num: 7,  label: '45° MID',    sub: 'GAUCHE', x: 13.5, y: 17.0, zone: 'mid' },
  { id: 'w-l',  num: 8,  label: '45° 3 PTS',  sub: 'GAUCHE', x: 9.5,  y: 24.5, zone: '3pt' },
  { id: 'b-l',  num: 9,  label: '0° MID',     sub: 'GAUCHE', x: 11.5, y: 6.5,  zone: 'mid' },
  { id: 'c-l',  num: 10, label: '0° 3 PTS',   sub: 'GAUCHE', x: 1.8,  y: 4.0,  zone: '3pt' },
];

export async function GET() {
  try {
    const existing = await prisma.court.findFirst();

    if (existing) {
      const updated = await prisma.court.update({
        where: { id: existing.id },
        data: {
          spotsConfig: DEFAULT_SPOTS,
          isDefault: true,
        },
      });
      return NextResponse.json({
        message: '✅ Terrain mis à jour avec les 10 spots officiels',
        court: updated,
      });
    }

    const court = await prisma.court.create({
      data: {
        name: '10 spots standard',
        isDefault: true,
        spotsConfig: DEFAULT_SPOTS,
      },
    });

    return NextResponse.json({
      message: '✅ Terrain créé avec les 10 spots officiels',
      court,
    });
  } catch (error: any) {
    console.error('Erreur seed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}