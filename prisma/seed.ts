import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Créer le terrain NBA Standard
  const nbaCourt = await prisma.court.upsert({
    where: { id: 'nba-standard' },
    update: {},
    create: {
      id: 'nba-standard',
      name: 'NBA Standard',
      description: 'Configuration NBA réglementaire avec 10 spots',
      isDefault: true,
      spots: [
        { id: 'b-r', num: 1, label: '0° MID', sub: 'DROITE', x: 38.5, y: 6.5, zone: 'mid' },
        { id: 'c-r', num: 2, label: '0° 3PTS', sub: 'DROITE', x: 48.2, y: 4.0, zone: '3pt' },
        { id: 'el-r', num: 3, label: '45° MID', sub: 'DROITE', x: 36.5, y: 17.0, zone: 'mid' },
        { id: 'w-r', num: 4, label: '45° 3PTS', sub: 'DROITE', x: 40.5, y: 24.5, zone: '3pt' },
        { id: 'ft', num: 5, label: 'FACE MID', sub: '15 FT', x: 23.5, y: 19.5, zone: 'mid' },
        { id: 'top', num: 6, label: 'FACE 3PTS', sub: 'CENTRE', x: 25, y: 30.4, zone: '3pt' },
        { id: 'el-l', num: 7, label: '45° MID', sub: 'GAUCHE', x: 13.5, y: 17.0, zone: 'mid' },
        { id: 'w-l', num: 8, label: '45° 3PTS', sub: 'GAUCHE', x: 9.5, y: 24.5, zone: '3pt' },
        { id: 'b-l', num: 9, label: '0° MID', sub: 'GAUCHE', x: 11.5, y: 6.5, zone: 'mid' },
        { id: 'c-l', num: 10, label: '0° 3PTS', sub: 'GAUCHE', x: 1.8, y: 4.0, zone: '3pt' },
      ],
    },
  });

  console.log('✅ Terrain créé :', nbaCourt.name);
  console.log('🎉 Seed terminé ! Tu peux maintenant créer tes joueurs dans l\'app.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });