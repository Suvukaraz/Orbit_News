import React from 'react';

interface OrbitLogoProps {
  size?: number;
  className?: string;
}

export const OrbitLogo: React.FC<OrbitLogoProps> = ({
  size = 28,
  className = '',
}) => (
  <div className={`flex items-center shrink-0 ${className}`}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className="block shrink-0"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A"/>
          <stop offset="50%" stopColor="#1E1B4B"/>
          <stop offset="100%" stopColor="#020617"/>
        </linearGradient>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6"/>
          <stop offset="50%" stopColor="#818CF8" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#C084FC" stopOpacity="0.4"/>
        </linearGradient>
        <linearGradient id="orbitCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8"/>
          <stop offset="50%" stopColor="#0284C7"/>
          <stop offset="100%" stopColor="#0369A1"/>
        </linearGradient>
        <linearGradient id="orbitPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E"/>
          <stop offset="50%" stopColor="#A855F7"/>
          <stop offset="100%" stopColor="#6366F1"/>
        </linearGradient>
        <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA"/>
          <stop offset="100%" stopColor="#1D4ED8"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#000000" floodOpacity="0.6"/>
        </filter>
        <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="glowPurple" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0"/>
        </radialGradient>
      </defs>

      <rect x="32" y="32" width="448" height="448" rx="108" fill="url(#bgGrad)" filter="url(#shadow)"/>
      <rect x="32" y="32" width="448" height="448" rx="108" fill="none" stroke="url(#borderGrad)" strokeWidth="2.5"/>
      <circle cx="256" cy="256" r="170" fill="url(#ambientGlow)"/>

      <g transform="translate(256, 256)">
        <g transform="rotate(-35)">
          <path d="M -160 0 A 160 62 0 1 0 130 -32" fill="none" stroke="url(#orbitPurple)" strokeWidth="10" strokeLinecap="round" strokeDasharray="280 40 100 20" opacity="0.85" filter="url(#glowPurple)"/>
          <circle cx="130" cy="-32" r="6" fill="#F43F5E"/>
        </g>

        <g transform="rotate(22)">
          <ellipse cx="0" cy="0" rx="152" ry="58" fill="none" stroke="url(#orbitCyan)" strokeWidth="16" strokeLinecap="round" strokeDasharray="320 60 90 40" filter="url(#glowCyan)"/>
          <circle cx="-152" cy="0" r="11" fill="#38BDF8" filter="url(#glowCyan)"/>
          <circle cx="-152" cy="0" r="5" fill="#FFFFFF"/>
        </g>

        <circle cx="0" cy="0" r="46" fill="url(#coreGrad)" filter="url(#shadow)"/>
        <path d="M -20 -12 L 8 -12 M -20 -2 L 20 -2 M -20 8 L 14 8 M -20 18 L 2 18" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.95"/>
        <path d="M 26 -24 A 36 36 0 0 1 26 24" fill="none" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" filter="url(#glowCyan)"/>
        <path d="M 36 -34 A 50 50 0 0 1 36 34" fill="none" stroke="#818CF8" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="8 6 20" opacity="0.8"/>

        <g transform="rotate(22)">
          <path d="M 80 49 A 152 58 0 0 0 152 0" fill="none" stroke="url(#orbitCyan)" strokeWidth="16" strokeLinecap="round"/>
        </g>
      </g>
    </svg>
  </div>
);
