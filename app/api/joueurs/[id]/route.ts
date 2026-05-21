import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: params.id },
    });
    if (!player) {
      return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error) {
    console.error('Erreur GET joueur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const player = await prisma.player.update({
      where: { id: params.id },
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
    console.error('Erreur PUT joueur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.player.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE joueur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}