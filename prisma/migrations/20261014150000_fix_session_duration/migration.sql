-- Durée des sessions : arrêter la dérive et réparer l'historique.
--
-- `GET /api/sessions/[id]/results` réécrivait `endedAt` à chaque appel. Rouvrir
-- la page résultats d'une vieille session la redatait donc à l'instant présent :
-- une séance de 52 min s'affichait à 38 545 min (26 jours). La route ne pose
-- plus la date qu'une fois ; reste à réparer ce qui a déjà été écrit.

-- 1. Heure réelle de la saisie, envoyée par l'appareil.
--
-- `createdAt` est l'heure d'arrivée au serveur. Depuis que les saisies passent
-- par une file rejouée au retour du réseau, elle ne dit plus quand le tir a eu
-- lieu. Pour l'historique les deux sont équivalentes, d'où la recopie.
ALTER TABLE "SpotResult" ADD COLUMN "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "SpotResult" SET "recordedAt" = "createdAt";

-- 2. `endedAt` recalé sur la dernière saisie de la session.
--
-- C'est la seule trace fiable de la fin réelle d'une séance : elle n'a pas
-- bougé quand la page résultats a été rouverte.
UPDATE "Session" s
SET "endedAt" = sub."lastEntry"
FROM (
  SELECT sp."sessionId" AS "sessionId", MAX(sr."recordedAt") AS "lastEntry"
  FROM "SpotResult" sr
  JOIN "SessionPlayer" sp ON sp."id" = sr."sessionPlayerId"
  GROUP BY sp."sessionId"
) AS sub
WHERE s."id" = sub."sessionId"
  AND s."endedAt" IS NOT NULL;

-- Une session terminée sans aucune saisie n'a duré que le temps de la créer.
UPDATE "Session" s
SET "endedAt" = s."startedAt"
WHERE s."endedAt" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "SessionPlayer" sp
    JOIN "SpotResult" sr ON sr."sessionPlayerId" = sp."id"
    WHERE sp."sessionId" = s."id"
  );
