import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error('Erreur GET joueurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const player = await prisma.player.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        nickname: body.nickname,
        number: body.number,
        position: body.position,
        photo: body.photo,
        avatar: body.avatar,
        nbaTeam: body.nbaTeam,
      },
    });
    return NextResponse.json(player);
  } catch (error) {
    console.error('Erreur POST joueur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}