/**
 * Tirage au sort des groupes de tir.
 *
 * À partir de 8-10 joueurs un entraînement se joue sur plusieurs paniers en
 * parallèle. Les groupes restent dans la même session : un seul classement
 * général, rien à fusionner entre deux appareils.
 */

export const GROUP_LABELS = ['A', 'B', 'C', 'D'] as const;

/** Nombre de groupes raisonnable par défaut : 3 à 4 joueurs par panier. */
export const MAX_GROUPS = GROUP_LABELS.length;

export interface DrawnPlayer {
  playerId: string;
  group: string;
  shootOrder: number;
}

/** Mélange de Fisher-Yates sur une copie : l'entrée n'est pas touchée. */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Répartit les joueurs au hasard dans `groupCount` groupes et tire l'ordre de
 * passage de chacun.
 *
 * La distribution est faite en tourniquet après mélange : à 11 joueurs sur 3
 * groupes on obtient 4 / 4 / 3, jamais 5 / 3 / 3. Le `shootOrder` est l'index
 * dans le groupe, donc le mélange fixe aussi qui tire en premier — ce n'est
 * plus l'ordre de sélection à l'écran.
 */
export function drawGroups(playerIds: readonly string[], groupCount: number): DrawnPlayer[] {
  const count = Math.max(1, Math.min(groupCount, MAX_GROUPS, playerIds.length || 1));
  const shuffled = shuffle(playerIds);
  const sizes = new Array<number>(count).fill(0);

  return shuffled.map((playerId, index) => {
    const groupIndex = index % count;
    const shootOrder = sizes[groupIndex];
    sizes[groupIndex] += 1;

    return {
      playerId,
      group: GROUP_LABELS[groupIndex],
      shootOrder,
    };
  });
}

/**
 * Groupes présents dans une session, dans l'ordre des étiquettes.
 *
 * Les sessions enregistrées avant la répartition ont `group: null` : elles
 * comptent pour un groupe unique, dont l'étiquette est `GROUP_LABELS[0]`.
 */
export function groupKeysOf(players: readonly { group?: string | null }[]): string[] {
  const keys = new Set<string>();
  players.forEach((p) => keys.add(p.group || GROUP_LABELS[0]));

  const known = GROUP_LABELS.filter((label) => keys.has(label));
  const unknown = [...keys].filter((key) => !GROUP_LABELS.includes(key as typeof GROUP_LABELS[number])).sort();

  return [...known, ...unknown];
}

/** Groupe effectif d'un joueur, en remplaçant le `null` historique. */
export function groupOf(player: { group?: string | null }): string {
  return player.group || GROUP_LABELS[0];
}
