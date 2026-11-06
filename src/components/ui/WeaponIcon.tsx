import React from 'react';

/** Maps shop item ids / engine weapon keys to a weapon silhouette key. */
export function getWeaponKeyFromItemId(id: string): string | null {
  switch (id) {
    case 'wep_shotgun': return 'shotgun';
    case 'wep_sniper': return 'sniper';
    case 'wep_minigun': return 'minigun';
    case 'wep_rocket': return 'rocket';
    case 'wep_carbine': return 'carbine';
    default: return null;
  }
}

/** Colored low-poly weapon artwork (same look as the in-game HUD weapon dock). */
export default function WeaponIcon({ weaponKey, className = 'zbh-wep-svg' }: { weaponKey: string; className?: string }) {
  if (weaponKey === 'shotgun') {
    return (
      <svg viewBox="0 0 88 28" className={className}>
        <path d="M4 22 L24 14 L26 20 L8 26 Z" fill="#8b5a2b" />
        <rect x="24" y="10" width="22" height="7" rx="1" fill="#4a5560" />
        <rect x="46" y="10" width="38" height="3.2" fill="#788896" />
        <rect x="46" y="14" width="30" height="2.6" fill="#37414a" />
        <rect x="50" y="13.5" width="16" height="4.5" rx="1" fill="#a06832" />
      </svg>
    );
  }
  if (weaponKey === 'sniper') {
    return (
      <svg viewBox="0 0 88 28" className={className}>
        <path d="M2 14 L20 12 L20 20 L4 22 Z" fill="#2e3b30" />
        <rect x="20" y="11" width="26" height="6.5" rx="1" fill="#435246" />
        <rect x="22" y="5.5" width="24" height="4" rx="1" fill="#1e262c" />
        <rect x="45" y="5" width="3" height="5" fill="#00e5ff" />
        <path d="M23 17.5 L28 17.5 L26 25 L21 25 Z" fill="#1e262c" />
        <rect x="33" y="17.5" width="8" height="6" fill="#2b343c" />
        <rect x="46" y="12.2" width="36" height="2.6" fill="#8494a4" />
        <rect x="81" y="11" width="5" height="5" rx="0.8" fill="#2b343c" />
      </svg>
    );
  }
  if (weaponKey === 'minigun') {
    return (
      <svg viewBox="0 0 88 28" className={className}>
        <rect x="10" y="9" width="28" height="12" rx="2" fill="#36404a" />
        <path d="M22 9 L22 4 L34 4 L34 9" fill="none" stroke="#6c7a86" strokeWidth="2.5" />
        <rect x="18" y="20" width="14" height="6" rx="1.5" fill="#4e5d28" />
        <rect x="38" y="9.5" width="44" height="2.2" fill="#8898a8" />
        <rect x="38" y="13.5" width="44" height="2.2" fill="#687888" />
        <rect x="38" y="17.5" width="44" height="2.2" fill="#8898a8" />
        <rect x="54" y="8.5" width="3.5" height="12" fill="#222a30" />
        <rect x="74" y="8.5" width="4" height="12" fill="#222a30" />
      </svg>
    );
  }
  if (weaponKey === 'rocket') {
    return (
      <svg viewBox="0 0 88 28" className={className}>
        <polygon points="2,7 12,10 12,18 2,21" fill="#2a322b" />
        <rect x="12" y="9" width="58" height="10" rx="1.5" fill="#3b5238" />
        <rect x="56" y="9" width="5" height="10" fill="#ffb300" />
        <rect x="28" y="19" width="5" height="6" fill="#1e2428" />
        <rect x="46" y="19" width="5" height="6" fill="#1e2428" />
        <rect x="36" y="5" width="8" height="4" fill="#1e2428" />
        <polygon points="70,8 85,14 70,20" fill="#d32f2f" />
      </svg>
    );
  }
  // Assault Rifle (carbine)
  return (
    <svg viewBox="0 0 88 28" className={className}>
      <path d="M4 12 L20 11 L20 18 L6 20 Z" fill="#2f3842" />
      <rect x="20" y="10" width="36" height="7.5" rx="1" fill="#4d5b68" />
      <rect x="28" y="6" width="12" height="4" rx="1" fill="#252d34" />
      <path d="M24 17 L30 17 L27 25 L21 25 Z" fill="#252d34" />
      <path d="M38 17 L44 17 L47 26 L40 26 Z" fill="#323c46" />
      <rect x="56" y="11.5" width="26" height="3.2" fill="#7c8b99" />
    </svg>
  );
}
