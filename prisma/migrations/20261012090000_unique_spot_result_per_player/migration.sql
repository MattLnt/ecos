-- Un joueur ne tire qu'une fois chaque spot dans une session. Sans contrainte,
-- un double appui ou un retour arrière laissait plusieurs lignes pour le même
-- couple : les stats affichaient alors « 10/20 tirs, 4/4 lancers francs ».

-- 1. Dédoublonnage : on garde la saisie la plus récente, qui correspond à la
--    dernière valeur voulue par l'utilisateur après un éventuel retour arrière.
DELETE FROM "SpotResult" a
USING "SpotResult" b
WHERE a."sessionPlayerId" = b."sessionPlayerId"
  AND a."spotNum" = b."spotNum"
  AND (a."createdAt" < b."createdAt"
       OR (a."createdAt" = b."createdAt" AND a."id" < b."id"));

-- 2. Les totaux avaient été incrémentés une fois par ligne : on les réaligne
--    sur la somme réelle des spots restants.
UPDATE "SessionPlayer" sp
SET "totalPoints" = COALESCE(
  (SELECT SUM(sr."points") FROM "SpotResult" sr WHERE sr."sessionPlayerId" = sp."id"),
  0
);

-- 3. La contrainte qui rend le problème impossible à reproduire.
CREATE UNIQUE INDEX "SpotResult_sessionPlayerId_spotNum_key"
  ON "SpotResult"("sessionPlayerId", "spotNum");
