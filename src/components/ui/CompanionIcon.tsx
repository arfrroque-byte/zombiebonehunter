import React from 'react';

export type CompanionKey = 'dog' | 'drone' | 'robot' | 'medic';

interface CompanionIconProps {
  companionKey?: CompanionKey | string;
  className?: string;
  size?: number;
}

export function getCompanionKeyFromItemId(id: string): CompanionKey | null {
  if (id === 'companion_dog') return 'dog';
  if (id === 'companion_drone') return 'drone';
  if (id === 'companion_robot') return 'robot';
  if (id === 'companion_medic') return 'medic';
  return null;
}

export const CompanionIcon: React.FC<CompanionIconProps> = ({
  companionKey,
  className = '',
  size = 48
}) => {
  const key = (companionKey || '').toLowerCase();

  if (key === 'dog') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path d="M12 40 L18 24 L26 28 L34 22 L44 26 L52 38 L48 48 L20 48 Z" fill="#603813" stroke="#d97706" strokeWidth="2" />
        <path d="M18 24 L22 14 L28 20 Z" fill="#b45309" stroke="#fbbf24" strokeWidth="1.5" />
        <path d="M44 26 L48 16 L52 24 Z" fill="#b45309" stroke="#fbbf24" strokeWidth="1.5" />
        <ellipse cx="26" cy="32" rx="2.5" ry="2" fill="#22c55e" />
        <ellipse cx="40" cy="32" rx="2.5" ry="2" fill="#22c55e" />
        <path d="M30 40 L33 44 L36 40 Z" fill="#1c1917" />
        <path d="M22 44 L44 44" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        <circle cx="33" cy="45" r="2" fill="#fbbf24" />
      </svg>
    );
  }

  if (key === 'drone') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <ellipse cx="32" cy="32" rx="14" ry="7" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
        <line x1="10" y1="26" x2="22" y2="30" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="54" y1="26" x2="42" y2="30" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="14" y1="38" x2="22" y2="34" stroke="#94a3b8" strokeWidth="2.5" />
        <line x1="50" y1="38" x2="42" y2="34" stroke="#94a3b8" strokeWidth="2.5" />
        <ellipse cx="10" cy="26" rx="7" ry="2" fill="#06b6d4" opacity="0.8" />
        <ellipse cx="54" cy="26" rx="7" ry="2" fill="#06b6d4" opacity="0.8" />
        <ellipse cx="14" cy="38" rx="6" ry="2" fill="#06b6d4" opacity="0.8" />
        <ellipse cx="50" cy="38" rx="6" ry="2" fill="#06b6d4" opacity="0.8" />
        <circle cx="32" cy="32" r="4" fill="#22d3ee" />
        <path d="M32 36 L32 44" stroke="#06b6d4" strokeWidth="2" />
        <circle cx="32" cy="45" r="1.5" fill="#f43f5e" />
      </svg>
    );
  }

  if (key === 'robot') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect x="22" y="14" width="20" height="14" rx="3" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="28" cy="20" r="2" fill="#60a5fa" />
        <circle cx="36" cy="20" r="2" fill="#60a5fa" />
        <line x1="32" y1="14" x2="32" y2="8" stroke="#3b82f6" strokeWidth="2" />
        <circle cx="32" cy="7" r="2" fill="#ef4444" />
        <rect x="18" y="30" width="28" height="20" rx="4" fill="#334155" stroke="#60a5fa" strokeWidth="2" />
        <circle cx="32" cy="40" r="4" fill="#38bdf8" />
        <rect x="10" y="32" width="6" height="14" rx="2" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
        <rect x="48" y="32" width="6" height="14" rx="2" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
        <circle cx="32" cy="36" r="18" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      </svg>
    );
  }

  if (key === 'medic') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <circle cx="32" cy="32" r="18" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
        <rect x="29" y="20" width="6" height="24" rx="1.5" fill="#34d399" />
        <rect x="20" y="29" width="24" height="6" rx="1.5" fill="#34d399" />
        <circle cx="24" cy="18" r="4" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
        <circle cx="40" cy="18" r="4" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
        <ellipse cx="32" cy="54" rx="12" ry="3" fill="#10b981" opacity="0.4" />
        <path d="M16 26 Q12 32 16 38" stroke="#6ee7b7" strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M48 26 Q52 32 48 38" stroke="#6ee7b7" strokeWidth="1.5" fill="none" opacity="0.7" />
      </svg>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.55
      }}
    >
      🐾
    </div>
  );
};
