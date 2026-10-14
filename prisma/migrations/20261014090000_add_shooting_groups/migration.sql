-- Répartition d'une session en groupes de tir.
--
-- À 11 joueurs, l'entraînement se joue sur plusieurs paniers en parallèle. Les
-- groupes vivent dans la même session : rien à fusionner, un seul classement
-- général, et les stats existantes ne bougent pas.

-- Groupe de tir ("A", "B", "C"…). NULL pour les sessions déjà enregistrées :
-- elles sont traitées comme un groupe unique.
ALTER TABLE "SessionPlayer" ADD COLUMN "group" TEXT;

-- Ordre de passage tiré au sort à la création, persisté pour qu'un
-- rechargement ne rebatte pas les cartes en pleine session.
ALTER TABLE "SessionPlayer" ADD COLUMN "shootOrder" INTEGER NOT NULL DEFAULT 0;
