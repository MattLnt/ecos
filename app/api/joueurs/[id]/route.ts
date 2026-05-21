import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await prisma.player.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const player = await prisma.player.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.player.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE joueur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}