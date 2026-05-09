/**
 * Ornaments SVG : decorations vectorielles pour chaque template.
 * Chaque ornement est positionné en absolu autour de la photo.
 */

/* ---------- Silver Lace : volutes blanches autour de la photo ---------- */
export function SilverLaceOrnament({ color = '#bfbfbf' }) {
  return (
    <svg className="ornament svg-silver" viewBox="0 0 600 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.95">
        {/* Left swirl */}
        <path d="M30 60 C 70 70, 90 100, 130 120 C 170 140, 200 130, 230 150 C 250 165, 260 200, 280 220" />
        <path d="M60 50 C 90 80, 110 120, 150 145 C 180 165, 220 165, 250 185" />
        <path d="M90 30 C 100 70, 130 110, 170 130" />
        <circle cx="40" cy="55" r="4" fill={color} />
        <circle cx="80" cy="40" r="3" fill={color} />
        <circle cx="160" cy="118" r="3" fill={color} />
        <path d="M120 90 q 8 -16 22 -10 q 14 6 8 22 q -6 14 -22 8 q -14 -6 -8 -20 z" fill={color} opacity="0.55" />
        <path d="M210 150 q 6 -12 18 -8 q 12 4 6 18 q -6 12 -18 8 q -12 -4 -6 -18 z" fill={color} opacity="0.4" />
        {/* Right swirl */}
        <path d="M570 60 C 530 70, 510 100, 470 120 C 430 140, 400 130, 370 150 C 350 165, 340 200, 320 220" />
        <path d="M540 50 C 510 80, 490 120, 450 145 C 420 165, 380 165, 350 185" />
        <path d="M510 30 C 500 70, 470 110, 430 130" />
        <circle cx="560" cy="55" r="4" fill={color} />
        <circle cx="520" cy="40" r="3" fill={color} />
        <circle cx="440" cy="118" r="3" fill={color} />
        <path d="M480 90 q -8 -16 -22 -10 q -14 6 -8 22 q 6 14 22 8 q 14 -6 8 -20 z" fill={color} opacity="0.55" />
        <path d="M390 150 q -6 -12 -18 -8 q -12 4 -6 18 q 6 12 18 8 q 12 -4 6 -18 z" fill={color} opacity="0.4" />
        {/* Center cascade */}
        <path d="M300 130 q -20 30 -10 60 q 10 -10 20 -30 q 10 20 20 30 q 10 -30 -10 -60" fill={color} opacity="0.5" />
        <path d="M300 200 v 50" />
      </g>
    </svg>
  );
}

/* ---------- Royal : anneau doré + fleurs noires/dorées ---------- */
export function RoyalOrnament({ gold = '#c9a14a', dark = '#0d0d0d' }) {
  return (
    <svg className="ornament svg-royal" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gold ring around the photo */}
      <circle cx="300" cy="220" r="180" stroke={gold} strokeWidth="3" fill="none" />
      <circle cx="300" cy="220" r="174" stroke={gold} strokeWidth="0.8" fill="none" opacity="0.55" />

      {/* Top-right floral cluster */}
      <g transform="translate(420 90)">
        <path d="M0 0 q 28 -10 60 -2 q 18 4 32 22 q 10 14 8 32 q -2 18 -18 26 q -22 12 -42 -2 q -18 -12 -28 -32 q -8 -16 -12 -44 z" fill={dark} />
        <circle cx="32" cy="28" r="5" fill={gold} />
        <circle cx="50" cy="44" r="3" fill={gold} />
        <path d="M14 52 q 8 -10 22 -4 q 12 6 6 20 q -6 12 -22 6 q -10 -4 -6 -22 z" fill={dark} stroke={gold} strokeWidth="1" />
        <path d="M52 -8 q 14 -2 22 8 q 8 10 -2 22 q -10 12 -22 4 q -10 -6 -8 -22 q 4 -12 10 -12 z" fill={dark} stroke={gold} strokeWidth="1" />
      </g>
      {/* gold dust */}
      <g fill={gold}>
        <circle cx="380" cy="80" r="1.6" />
        <circle cx="395" cy="65" r="1.2" />
        <circle cx="412" cy="55" r="1" />
        <circle cx="370" cy="100" r="1" />
        <circle cx="500" cy="170" r="1.4" />
        <circle cx="475" cy="190" r="1" />
        <circle cx="455" cy="210" r="1" />
        <circle cx="115" cy="120" r="1.4" />
        <circle cx="135" cy="100" r="1" />
      </g>

      {/* Bottom-right floral (decorative below body) */}
      <g transform="translate(440 470)">
        <path d="M0 0 q 24 -8 50 -2 q 18 4 30 22 q 10 14 4 32 q -8 18 -28 18 q -22 0 -38 -16 q -16 -16 -22 -36 q -4 -12 4 -18 z" fill={dark} />
        <path d="M14 22 q 8 -10 22 -4 q 12 6 6 20 q -6 12 -22 6 q -10 -4 -6 -22 z" fill={dark} stroke={gold} strokeWidth="1" />
        <circle cx="38" cy="34" r="4" fill={gold} />
        <circle cx="54" cy="48" r="2.6" fill={gold} />
      </g>

      {/* Top-left small accent */}
      <g transform="translate(80 80)">
        <path d="M0 0 q 16 -4 28 4 q 10 8 6 22 q -6 14 -20 12 q -16 -2 -22 -18 q -4 -14 8 -20 z" fill={dark} stroke={gold} strokeWidth="1" />
      </g>
    </svg>
  );
}

/* ---------- Floral : roses aquarelle + eucalyptus ---------- */
export function FloralOrnament({ rose = '#d4748b', leaf = '#7c9a6e' }) {
  return (
    <svg className="ornament svg-floral" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top-left bouquet */}
      <g transform="translate(40 40)">
        <ellipse cx="40" cy="40" rx="34" ry="26" fill={rose} opacity="0.55" />
        <ellipse cx="55" cy="52" rx="22" ry="18" fill={rose} opacity="0.85" />
        <ellipse cx="40" cy="48" rx="14" ry="12" fill={rose} />
        <circle cx="42" cy="44" r="6" fill="#fff" opacity="0.6" />
        {/* leaves */}
        <path d="M5 70 q 30 -10 60 -8 q 30 2 50 22" stroke={leaf} strokeWidth="2" fill="none" />
        <ellipse cx="20" cy="78" rx="10" ry="4" fill={leaf} opacity="0.7" transform="rotate(-25 20 78)" />
        <ellipse cx="42" cy="86" rx="10" ry="4" fill={leaf} opacity="0.7" transform="rotate(-10 42 86)" />
        <ellipse cx="68" cy="86" rx="10" ry="4" fill={leaf} opacity="0.7" transform="rotate(10 68 86)" />
        <ellipse cx="92" cy="78" rx="10" ry="4" fill={leaf} opacity="0.7" transform="rotate(25 92 78)" />
        <ellipse cx="80" cy="20" rx="22" ry="16" fill={rose} opacity="0.45" />
      </g>
      {/* Bottom-right bouquet */}
      <g transform="translate(420 480)">
        <ellipse cx="80" cy="60" rx="42" ry="32" fill={rose} opacity="0.5" />
        <ellipse cx="95" cy="72" rx="26" ry="22" fill={rose} opacity="0.85" />
        <ellipse cx="80" cy="68" rx="16" ry="14" fill={rose} />
        <circle cx="82" cy="64" r="7" fill="#fff" opacity="0.6" />
        <path d="M0 30 q 40 -16 80 -8 q 40 8 70 36" stroke={leaf} strokeWidth="2" fill="none" />
        <ellipse cx="20" cy="36" rx="12" ry="5" fill={leaf} opacity="0.7" transform="rotate(-25 20 36)" />
        <ellipse cx="52" cy="36" rx="12" ry="5" fill={leaf} opacity="0.7" transform="rotate(-5 52 36)" />
        <ellipse cx="120" cy="50" rx="12" ry="5" fill={leaf} opacity="0.7" transform="rotate(15 120 50)" />
        <ellipse cx="40" cy="0" rx="22" ry="16" fill={rose} opacity="0.45" />
      </g>
    </svg>
  );
}

/* ---------- Modern : géométrie minimaliste + lignes dorées ---------- */
export function ModernOrnament({ accent = '#c9a14a' }) {
  return (
    <svg className="ornament svg-modern" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke={accent} fill="none" strokeWidth="1">
        <rect x="40" y="40" width="520" height="520" />
        <rect x="50" y="50" width="500" height="500" opacity="0.4" />
      </g>
      <g stroke={accent} strokeWidth="1.2">
        <line x1="200" y1="240" x2="400" y2="240" />
        <line x1="240" y1="248" x2="360" y2="248" opacity="0.5" />
      </g>
      {/* Corner accents */}
      <g fill={accent}>
        <circle cx="60" cy="60" r="3" />
        <circle cx="540" cy="60" r="3" />
        <circle cx="60" cy="540" r="3" />
        <circle cx="540" cy="540" r="3" />
      </g>
      {/* Botanical sprig top-center */}
      <g transform="translate(300 30)" stroke={accent} strokeWidth="1" fill="none">
        <path d="M0 0 v 40" />
        <path d="M0 8 q -10 -2 -16 4" />
        <path d="M0 8 q 10 -2 16 4" />
        <path d="M0 22 q -12 0 -18 8" />
        <path d="M0 22 q 12 0 18 8" />
      </g>
    </svg>
  );
}

/* ---------- Heart Gold : grand cœur stylisé pour photo en clip ---------- */
export function HeartFrameOrnament({ accent = '#d4af37' }) {
  // Cœur large + petits cœurs satellites + double trait
  return (
    <svg className="ornament svg-heart" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="50%" stopColor="#f4d97a" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* Outer hand-drawn heart */}
      <path
        d="M300 530
           C 200 470, 80 380, 70 270
           C 62 180, 130 110, 210 130
           C 260 140, 290 175, 300 210
           C 310 175, 340 140, 390 130
           C 470 110, 538 180, 530 270
           C 520 380, 400 470, 300 530 Z"
        stroke="url(#heartGrad)" strokeWidth="6" strokeLinejoin="round" fill="none"
      />
      {/* Inner thinner heart */}
      <path
        d="M300 510
           C 215 460, 105 380, 96 275
           C 90 195, 145 135, 215 152
           C 258 162, 285 192, 300 222
           C 315 192, 342 162, 385 152
           C 455 135, 510 195, 504 275
           C 495 380, 385 460, 300 510 Z"
        stroke={accent} strokeWidth="1.4" fill="none" opacity="0.55"
      />
      {/* Tiny gold hearts dotted around */}
      <g fill={accent}>
        {[
          [120, 200], [90, 280], [110, 360], [180, 440], [260, 510],
          [340, 510], [420, 440], [490, 360], [510, 280], [480, 200],
          [400, 130], [300, 110], [200, 130], [150, 160], [450, 160],
        ].map(([cx, cy], i) => (
          <path key={i} transform={`translate(${cx} ${cy}) scale(${0.55 + (i % 3) * 0.18})`}
                d="M0 4 c -6 -10 -22 -10 -22 4 c 0 10 12 18 22 26 c 10 -8 22 -16 22 -26 c 0 -14 -16 -14 -22 -4 z" />
        ))}
      </g>
    </svg>
  );
}

/* ---------- Damask : volutes baroques en bandeau (style faire-part vintage) ---------- */
export function DamaskOrnament({ color = '#ffffff' }) {
  return (
    <svg className="ornament svg-damask" viewBox="0 0 800 200" fill={color} xmlns="http://www.w3.org/2000/svg">
      <g>
        {/* Centre symétrique */}
        <path d="M400 30
                 c 8 16, 26 22, 42 14
                 c 12 -6, 16 -22, 8 -32
                 c 16 6, 30 22, 28 40
                 c -2 22, -22 36, -44 32
                 c 8 14, 6 32 -6 44
                 c -10 10, -26 8, -34 -4
                 c 8 26, 32 42, 60 38
                 c 28 -4, 50 -28, 50 -56
                 c 30 8, 50 36, 44 66
                 c -6 30, -36 50, -66 46
                 c -10 16, -30 22, -46 14
                 c -16 -8, -22 -28, -14 -42
                 c -20 4, -42 -8, -50 -28
                 c -8 -22, 4 -46, 26 -54
                 c -6 -16, 0 -34, 14 -42 z" opacity="0.95" />
        {/* Mirror */}
        <g transform="translate(800 0) scale(-1 1)">
          <path d="M400 30
                   c 8 16, 26 22, 42 14
                   c 12 -6, 16 -22, 8 -32
                   c 16 6, 30 22, 28 40
                   c -2 22, -22 36, -44 32
                   c 8 14, 6 32 -6 44
                   c -10 10, -26 8, -34 -4
                   c 8 26, 32 42, 60 38
                   c 28 -4, 50 -28, 50 -56
                   c 30 8, 50 36, 44 66
                   c -6 30, -36 50, -66 46
                   c -10 16, -30 22, -46 14
                   c -16 -8, -22 -28, -14 -42
                   c -20 4, -42 -8, -50 -28
                   c -8 -22, 4 -46, 26 -54
                   c -6 -16, 0 -34, 14 -42 z" opacity="0.95" />
        </g>
        {/* Leaves left */}
        <path d="M150 100 q 30 -50 90 -40 q 50 8 70 50 q -30 -10 -60 -2 q -40 10 -100 -8 z" opacity="0.92" />
        <path d="M80 130 q 20 -30 60 -30 q 40 0 60 30 q -30 -8 -60 0 q -30 8 -60 0 z" opacity="0.85" />
        {/* Leaves right (mirror) */}
        <g transform="translate(800 0) scale(-1 1)">
          <path d="M150 100 q 30 -50 90 -40 q 50 8 70 50 q -30 -10 -60 -2 q -40 10 -100 -8 z" opacity="0.92" />
          <path d="M80 130 q 20 -30 60 -30 q 40 0 60 30 q -30 -8 -60 0 q -30 8 -60 0 z" opacity="0.85" />
        </g>
        {/* Drops */}
        <ellipse cx="380" cy="170" rx="6" ry="14" />
        <ellipse cx="420" cy="170" rx="6" ry="14" />
        <circle cx="400" cy="190" r="3" />
      </g>
    </svg>
  );
}

