/**
 * FixtureThumb.tsx — 조명 기재 제품 썸네일(SVG).
 * 실제 제품 사진은 저작권/오프라인 문제로 번들하지 않고, 기재 종류(kind)별
 * 제품 실루엣 + 브랜드 색 + 색온도 발광면으로 "어떤 제품인지" 알아볼 수 있게 그린다.
 */
import { FIXTURES } from '../../sim/fixtures';
import { kelvinCSS } from '../../sim/kelvin';

/** 라벨에서 브랜드 강조색 추정 */
function brandColor(label: string): string {
  if (label.includes('Aputure')) return '#2b6fff';
  if (label.includes('Nanlite')) return '#ff7a1a';
  if (label.includes('Godox')) return '#e23b2e';
  if (label.includes('Amaran')) return '#16b8a6';
  return '#8a8f99';
}

const BODY = '#33343c';
const BODY_D = '#25262c';
const METAL = '#c7c9d0';
const CHIP = '#dfe1e6';

export function FixtureThumb({ fix, kelvin, size = 34 }: { fix: string; kelvin?: number; size?: number }) {
  const F = FIXTURES[fix];
  if (!F) return null;
  const k = kelvin ?? Math.round((F.cct[0] + F.cct[1]) / 2);
  const glow = kelvinCSS(k);
  const brand = brandColor(F.label);

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="fix-thumb" aria-hidden>
      <rect x="0.5" y="0.5" width="43" height="43" rx="8" fill={CHIP} stroke="rgba(0,0,0,0.18)" />
      <FixtureArt kind={F.kind} glow={glow} brand={brand} />
    </svg>
  );
}

function FixtureArt({ kind, glow, brand }: { kind: string; glow: string; brand: string }) {
  switch (kind) {
    case 'panel':
      // 평판 LED 패널 + 요크
      return (
        <g>
          <rect x="8" y="9" width="28" height="22" rx="2.5" fill={BODY} />
          <rect x="10.5" y="11.5" width="23" height="17" rx="1.5" fill={glow} />
          <g stroke="rgba(0,0,0,0.18)" strokeWidth="0.6">
            <line x1="16" y1="11.5" x2="16" y2="28.5" />
            <line x1="22" y1="11.5" x2="22" y2="28.5" />
            <line x1="28" y1="11.5" x2="28" y2="28.5" />
            <line x1="10.5" y1="17" x2="33.5" y2="17" />
            <line x1="10.5" y1="23" x2="33.5" y2="23" />
          </g>
          <path d="M8 20 L4 20 M36 20 L40 20" stroke={BODY_D} strokeWidth="2" strokeLinecap="round" />
          <rect x="19" y="31" width="6" height="8" rx="1" fill={BODY_D} />
          <rect x="8" y="9" width="4" height="22" rx="2" fill={brand} opacity="0.9" />
        </g>
      );
    case 'tube':
      // RGB 튜브 라이트(세로)
      return (
        <g>
          <rect x="18.5" y="4" width="7" height="36" rx="3.5" fill={BODY_D} />
          <rect x="19.75" y="6.5" width="4.5" height="31" rx="2.25" fill={glow} />
          <rect x="18.5" y="4" width="7" height="3.5" rx="1.5" fill={brand} />
          <rect x="18.5" y="37" width="7" height="3" rx="1.5" fill={BODY} />
        </g>
      );
    case 'prac':
      // 프랙티컬(전구+갓)
      return (
        <g>
          <path d="M13 16 L31 16 L27 9 L17 9 Z" fill={BODY} />
          <circle cx="22" cy="25" r="8" fill={glow} />
          <rect x="19" y="32" width="6" height="6" rx="1" fill={BODY_D} />
        </g>
      );
    case 'bounce':
      // 반사판(실버/화이트)
      return (
        <g>
          <ellipse cx="22" cy="22" rx="15" ry="16" fill="#eef0f3" stroke="#b9bcc4" strokeWidth="1.4" />
          <path d="M22 6 A16 16 0 0 1 22 38 Z" fill="#cfd3da" />
          <ellipse cx="22" cy="22" rx="15" ry="16" fill="none" stroke={brand} strokeWidth="1.6" opacity="0.55" />
        </g>
      );
    case 'cob':
    default:
      // COB 모노라이트(리플렉터 + 바디 + 마운트) — 측면
      return (
        <g>
          {/* 마운트 스터드 */}
          <rect x="20" y="33" width="4" height="6" rx="1" fill={BODY_D} />
          <rect x="15" y="31" width="14" height="3" rx="1.5" fill={BODY_D} />
          {/* 바디 배럴 */}
          <rect x="24" y="15" width="12" height="13" rx="2.5" fill={BODY} />
          <rect x="33" y="17" width="3" height="9" rx="1.5" fill={brand} />
          {/* 리플렉터(왼쪽 개구) */}
          <path d="M24 12 L24 31 L11 35 L11 8 Z" fill={METAL} stroke="#a9abb3" strokeWidth="0.8" />
          <ellipse cx="12.5" cy="21.5" rx="3.2" ry="13" fill={glow} />
        </g>
      );
  }
}
