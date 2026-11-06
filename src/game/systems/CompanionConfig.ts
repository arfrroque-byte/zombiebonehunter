// Companion configuration and level tables for Phase 7 (Zombie Bone Hunter)
// Exactly four companion categories: dog, drone, robot, medic

export type CompanionId = 'dog' | 'drone' | 'robot' | 'medic';

export const COMPANION_MAX_LEVEL = 5;

export interface CompanionStats {
  id: CompanionId;
  name: string;
  role: string;
  level: number;
  // Dog & Drone combat stats
  damage?: number;
  fireCooldown?: number;
  attackRange?: number;
  moveSpeed?: number;
  // Robot barrier & defensive push stats
  barrierHp?: number;
  barrierDuration?: number;
  defenseCooldown?: number;
  pushRadius?: number;
  pushForce?: number;
  // Medic heal stats
  healAmount?: number;
  healCooldown?: number;
  chargesPerWave?: number;
}

export const COMPANION_TABLES: Record<CompanionId, Array<Omit<CompanionStats, 'id' | 'name' | 'role' | 'level'>>> = {
  // Pet fire rate halved: attack cooldowns doubled (previously 0.55 -> 0.47)
  dog: [
    { damage: 25, fireCooldown: 1.10, attackRange: 16, moveSpeed: 6.2 },
    { damage: 28, fireCooldown: 1.06, attackRange: 17, moveSpeed: 6.6 },
    { damage: 31, fireCooldown: 1.02, attackRange: 18, moveSpeed: 7.0 },
    { damage: 34, fireCooldown: 0.98, attackRange: 19, moveSpeed: 7.4 },
    { damage: 37, fireCooldown: 0.94, attackRange: 20, moveSpeed: 7.8 }
  ],
  drone: [
    { damage: 18, fireCooldown: 0.84, attackRange: 18 },
    { damage: 20, fireCooldown: 0.80, attackRange: 19 },
    { damage: 22, fireCooldown: 0.76, attackRange: 20 },
    { damage: 24, fireCooldown: 0.72, attackRange: 21 },
    { damage: 26, fireCooldown: 0.68, attackRange: 22 }
  ],
  robot: [
    { barrierHp: 30, barrierDuration: 3.0, defenseCooldown: 28, pushRadius: 4.5, pushForce: 6.0 },
    { barrierHp: 40, barrierDuration: 3.5, defenseCooldown: 25, pushRadius: 4.8, pushForce: 6.5 },
    { barrierHp: 50, barrierDuration: 4.0, defenseCooldown: 22, pushRadius: 5.2, pushForce: 7.0 },
    { barrierHp: 60, barrierDuration: 4.5, defenseCooldown: 19, pushRadius: 5.6, pushForce: 7.5 },
    { barrierHp: 70, barrierDuration: 5.0, defenseCooldown: 16, pushRadius: 6.0, pushForce: 8.0 }
  ],
  medic: [
    { healAmount: 18, healCooldown: 16, chargesPerWave: 2 },
    { healAmount: 22, healCooldown: 14, chargesPerWave: 2 },
    { healAmount: 26, healCooldown: 13, chargesPerWave: 2 },
    { healAmount: 30, healCooldown: 11, chargesPerWave: 2 },
    { healAmount: 34, healCooldown: 10, chargesPerWave: 3 }
  ]
};

export const COMPANION_INFO: Record<CompanionId, { name: string; role: string; desc: string }> = {
  dog: {
    name: 'Combat Dog',
    role: 'OFFENSIVE / MELEE',
    desc: 'Fierce cyber-hound that tracks nearby zombies, biting with ferocious damage.'
  },
  drone: {
    name: 'Drone Companion',
    role: 'OFFENSIVE / RANGED',
    desc: 'High-tech aerial drone hovering above the player, firing precision cyan lasers.'
  },
  robot: {
    name: 'Shield Robot',
    role: 'DEFENSIVE / CROWD CONTROL',
    desc: 'Heavy mechanical unit that deploys an energy barrier & pushes encroaching zombies away.'
  },
  medic: {
    name: 'Medical Pet',
    role: 'SUPPORT / HEALER',
    desc: 'Nanotech support companion providing emergency HP restoration when player is wounded.'
  }
};

export function getCompanionStats(id: CompanionId, level: number = 1): CompanionStats {
  const lvl = Math.max(1, Math.min(COMPANION_MAX_LEVEL, Math.round(level || 1)));
  const table = COMPANION_TABLES[id] || COMPANION_TABLES.dog;
  const entry = table[lvl - 1];
  const info = COMPANION_INFO[id] || COMPANION_INFO.dog;
  return {
    id,
    name: info.name,
    role: info.role,
    level: lvl,
    ...entry
  };
}

export function getCompanionStatLine(id: CompanionId, level: number = 1): string {
  const s = getCompanionStats(id, level);
  if (id === 'dog') {
    return `DMG: ${s.damage} | ATK SPD: ${(1 / (s.fireCooldown || 1.10)).toFixed(1)}/s | SPD: ${s.moveSpeed} | Range: ${s.attackRange}m`;
  }
  if (id === 'drone') {
    return `DMG: ${s.damage} | FIRE RATE: ${(1 / (s.fireCooldown || 0.84)).toFixed(1)}/s | Range: ${s.attackRange}m (Aerial)`;
  }
  if (id === 'robot') {
    return `BARRIER: ${s.barrierHp} HP (${s.barrierDuration}s) | PUSH: ${s.pushRadius}m | COOLDOWN: ${s.defenseCooldown}s`;
  }
  if (id === 'medic') {
    return `HEAL: +${s.healAmount} HP | COOLDOWN: ${s.healCooldown}s | CHARGES: ${s.chargesPerWave}/wave (HP ≤ 50%)`;
  }
  return '';
}
