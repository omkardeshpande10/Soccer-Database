import React from 'react';

/**
 * @typedef {Object} Player
 * @property {string}      name
 * @property {string}      photo
 * @property {string}      position
 * @property {number}      age
 * @property {string}      citizenship
 * @property {number|null} height
 * @property {string}      club
 * @property {number|null} rating
 */

// ─── field dimensions ─────────────────────────────────────────────────────────
// Vertical orientation, realistic ~2:3 aspect ratio
const W  = 520;   // field width  (px)
const H  = 780;   // field height (px)
const M  = 28;    // margin from SVG edge to touch-line

// Touch-line box (the white border rect)
const FX = M;          // left edge
const FY = M;          // top edge
const FW = W - M * 2;  // field width  inside margins
const FH = H - M * 2;  // field height inside margins

// ─── official pitch ratios (relative to FW / FH) ─────────────────────────────
const PB_W  = FW * 0.60;          // penalty box width  (~40.32 m of 68 m)
const PB_H  = FH * 0.168;         // penalty box height (~16.5 m of 105 m)
const GA_W  = FW * 0.308;         // goal area width    (~18.32 m of 68 m... adjusted)
const GA_H  = FH * 0.057;         // goal area height   (~5.5 m of 105 m)
const CC_R  = FH * 0.091;         // centre circle radius (~9.15 m)
const PS_D  = FH * 0.108;         // penalty spot distance from goal line (~11 m)
const ARC_R = CC_R;               // penalty arc radius = same as centre circle
const CORNER_R = FH * 0.010;      // corner arc radius (~1 m)

// Goal dimensions (rectangle outside the field)
const GOAL_W = FW * 0.178;        // goal width (~7.32 m)
const GOAL_H = 12;                 // visual depth of goal net

// ─── derived x positions (centered horizontally) ─────────────────────────────
const cx  = FX + FW / 2;          // horizontal centre
const cy  = FY + FH / 2;          // vertical centre

const pbX = cx - PB_W / 2;
const gaX = cx - GA_W / 2;
const goalX = cx - GOAL_W / 2;

// ─── formation slot positions (fractional, within field play area) ────────────
// y is fraction of FH from top, x is fraction of FW from left
function formationSlots() {
  const rows = [
    { y: 0.10, count: 2 },   // forwards
    { y: 0.33, count: 4 },   // midfielders
    { y: 0.58, count: 4 },   // defenders
    { y: 0.88, count: 1 },   // goalkeeper
  ];

  const slots = [];
  let squadNo = 1;

  rows.forEach(({ y, count }) => {
    const step = 1 / (count + 1);
    for (let i = 1; i <= count; i++) {
      slots.push({
        x: FX + step * i * FW,
        y: FY + y * FH,
        squadNo: squadNo++,
      });
    }
  });

  return slots;
}

const SLOTS = formationSlots();
const AVATAR_R = 22;

// ─── sub-components ───────────────────────────────────────────────────────────

/** Single player token */
function PlayerToken({ player, slot }) {
  const { x: px, y: py, squadNo } = slot;

  const MAX_NAME = 13;
  const displayName =
    player.name.length > MAX_NAME
      ? player.name.slice(0, MAX_NAME - 1) + '…'
      : player.name;

  const clipId = `clip-${squadNo}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={px} cy={py} r={AVATAR_R} />
        </clipPath>
      </defs>

      {/* drop shadow ring */}
      <circle cx={px} cy={py + 1} r={AVATAR_R + 3} fill="rgba(0,0,0,0.25)" />

      {/* white border ring */}
      <circle cx={px} cy={py} r={AVATAR_R + 2.5} fill="white" />

      {/* player photo */}
      <image
        href={player.photo}
        x={px - AVATAR_R}
        y={py - AVATAR_R}
        width={AVATAR_R * 2}
        height={AVATAR_R * 2}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* squad number badge */}
      <circle
        cx={px + AVATAR_R - 5}
        cy={py - AVATAR_R + 5}
        r={8}
        fill="#1a3fd4"
        stroke="white"
        strokeWidth="1.5"
      />
      <text
        x={px + AVATAR_R - 5}
        y={py - AVATAR_R + 9}
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fill="white"
        style={{ userSelect: 'none' }}
      >
        {squadNo}
      </text>

      {/* name label with dark outline for legibility */}
      <text
        x={px}
        y={py + AVATAR_R + 13}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="white"
        stroke="rgba(0,0,0,0.75)"
        strokeWidth="2.5"
        paintOrder="stroke"
        style={{ userSelect: 'none' }}
      >
        {displayName}
      </text>
    </g>
  );
}

/** Official pitch markings */
function FieldMarkings() {
  const mk = {
    fill:        'none',
    stroke:      'white',
    strokeWidth: 1.8,
  };

  // ── penalty arc path helper ──────────────────────────────────────────────
  // Arc curves AWAY from goal (outward into field) from the penalty spot.
  // We only draw the portion outside the penalty box.
  // Top penalty arc: spot at (cx, FY + PS_D), arc curves downward (toward center)
  // Bottom penalty arc: spot at (cx, FY + FH - PS_D), arc curves upward (toward center)

  // The arc is a full circle of radius ARC_R around the penalty spot,
  // clipped to only show the part outside the penalty box.
  // We compute the chord intersection with the penalty box line and draw the arc.

  // For top: penalty box bottom edge is at FY + PB_H
  // spot y = FY + PS_D, box edge y = FY + PB_H
  // dist from spot to box edge = PB_H - PS_D
  const topSpotY  = FY + PS_D;
  const botSpotY  = FY + FH - PS_D;
  const topBoxEdgeY = FY + PB_H;
  const botBoxEdgeY = FY + FH - PB_H;

  // half-chord at the box edge intersection
  const topDist = topBoxEdgeY - topSpotY;  // positive → box edge is below spot
  const botDist = botSpotY - botBoxEdgeY;  // positive → box edge is above spot

  const topHalfChord = Math.sqrt(Math.max(0, ARC_R * ARC_R - topDist * topDist));
  const botHalfChord = Math.sqrt(Math.max(0, ARC_R * ARC_R - botDist * botDist));

  // SVG arc: large-arc-flag=0, sweep=1 for clockwise
  // Top arc curves downward (away from top goal → toward center)
  const topArc = `M ${cx - topHalfChord} ${topBoxEdgeY}
    A ${ARC_R} ${ARC_R} 0 0 0 ${cx + topHalfChord} ${topBoxEdgeY}`;

  // Bottom arc curves upward (away from bottom goal → toward center)
  const botArc = `M ${cx - botHalfChord} ${botBoxEdgeY}
    A ${ARC_R} ${ARC_R} 0 0 1 ${cx + botHalfChord} ${botBoxEdgeY}`;

  return (
    <g>
      {/* ── goals (outside field boundary) ── */}
      {/* top goal */}
      <rect
        x={goalX} y={FY - GOAL_H}
        width={GOAL_W} height={GOAL_H}
        fill="rgba(255,255,255,0.15)"
        stroke="white"
        strokeWidth="1.8"
      />
      {/* top goal net lines */}
      {[1, 2, 3].map(i => (
        <line
          key={`tg-${i}`}
          x1={goalX + (GOAL_W / 4) * i} y1={FY - GOAL_H}
          x2={goalX + (GOAL_W / 4) * i} y2={FY}
          stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"
        />
      ))}
      <line
        x1={goalX} y1={FY - GOAL_H / 2}
        x2={goalX + GOAL_W} y2={FY - GOAL_H / 2}
        stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"
      />

      {/* bottom goal */}
      <rect
        x={goalX} y={FY + FH}
        width={GOAL_W} height={GOAL_H}
        fill="rgba(255,255,255,0.15)"
        stroke="white"
        strokeWidth="1.8"
      />
      {[1, 2, 3].map(i => (
        <line
          key={`bg-${i}`}
          x1={goalX + (GOAL_W / 4) * i} y1={FY + FH}
          x2={goalX + (GOAL_W / 4) * i} y2={FY + FH + GOAL_H}
          stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"
        />
      ))}
      <line
        x1={goalX} y1={FY + FH + GOAL_H / 2}
        x2={goalX + GOAL_W} y2={FY + FH + GOAL_H / 2}
        stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"
      />

      {/* ── field border ── */}
      <rect x={FX} y={FY} width={FW} height={FH} {...mk} />

      {/* ── halfway line ── */}
      <line x1={FX} y1={cy} x2={FX + FW} y2={cy} {...mk} />

      {/* ── centre circle + spot ── */}
      <circle cx={cx} cy={cy} r={CC_R} {...mk} />
      <circle cx={cx} cy={cy} r={3} fill="white" />

      {/* ── TOP penalty area ── */}
      <rect x={pbX} y={FY} width={PB_W} height={PB_H} {...mk} />
      {/* top goal area (six-yard box) */}
      <rect x={gaX} y={FY} width={GA_W} height={GA_H} {...mk} />
      {/* top penalty spot */}
      <circle cx={cx} cy={topSpotY} r={2.5} fill="white" />
      {/* top penalty arc */}
      <path d={topArc} {...mk} />

      {/* ── BOTTOM penalty area ── */}
      <rect x={pbX} y={FY + FH - PB_H} width={PB_W} height={PB_H} {...mk} />
      {/* bottom goal area (six-yard box) */}
      <rect x={gaX} y={FY + FH - GA_H} width={GA_W} height={GA_H} {...mk} />
      {/* bottom penalty spot */}
      <circle cx={cx} cy={botSpotY} r={2.5} fill="white" />
      {/* bottom penalty arc */}
      <path d={botArc} {...mk} />

      {/* ── corner arcs ── */}
      {/* top-left */}
      <path
        d={`M ${FX} ${FY + CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 0 ${FX + CORNER_R} ${FY}`}
        {...mk}
      />
      {/* top-right */}
      <path
        d={`M ${FX + FW - CORNER_R} ${FY} A ${CORNER_R} ${CORNER_R} 0 0 0 ${FX + FW} ${FY + CORNER_R}`}
        {...mk}
      />
      {/* bottom-left */}
      <path
        d={`M ${FX} ${FY + FH - CORNER_R} A ${CORNER_R} ${CORNER_R} 0 0 1 ${FX + CORNER_R} ${FY + FH}`}
        {...mk}
      />
      {/* bottom-right */}
      <path
        d={`M ${FX + FW - CORNER_R} ${FY + FH} A ${CORNER_R} ${CORNER_R} 0 0 1 ${FX + FW} ${FY + FH - CORNER_R}`}
        {...mk}
      />
    </g>
  );
}

/** Empty-state overlay */
function EmptyState() {
  return (
    <g>
      <rect
        x={cx - 190} y={cy - 28}
        width={380} height={56}
        rx={8}
        fill="rgba(0,0,0,0.50)"
      />
      <text
        x={cx} y={cy + 6}
        textAnchor="middle"
        fontSize="13"
        fill="white"
        fontWeight="500"
        style={{ userSelect: 'none' }}
      >
        Click Generate Random Team to see the formation
      </text>
    </g>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

/**
 * FormationBoard
 *
 * @param {{ players: Player[] }} props
 *   Pass exactly 11 players (or fewer to show the empty state).
 */
function FormationBoard({ players = [] }) {
  const hasPlayers = players.length >= 11;
  const active     = hasPlayers ? players.slice(0, 11) : [];

  // SVG total height includes space for goals sticking outside the field
  const svgH = H + GOAL_H * 2;

  const containerStyle = {
    display:      'inline-block',
    borderRadius: '12px',
    overflow:     'hidden',
    boxShadow:    '0 4px 24px rgba(0,0,0,0.40), inset 0 0 40px rgba(0,0,0,0.12)',
    lineHeight:   0,
  };

  const svgStyle = {
    display:    'block',
    background: 'linear-gradient(180deg, #3aaa5c 0%, #2e9950 18%, #38a858 36%, #2e9950 54%, #38a858 72%, #2e9950 90%, #3aaa5c 100%)',
  };

  return (
    <div style={containerStyle}>
      <svg
        width={W}
        height={svgH}
        viewBox={`0 0 ${W} ${svgH}`}
        style={svgStyle}
        aria-label="Football formation board"
      >
        {/* defs: inner shadow filter */}
        <defs>
          <filter id="inner-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feFlood floodColor="rgba(0,0,0,0.30)" result="color" />
            <feComposite in="color" in2="SourceGraphic" operator="in" result="shadow" />
            <feGaussianBlur in="shadow" stdDeviation="6" result="blurred" />
            <feComposite in="blurred" in2="SourceGraphic" operator="over" />
          </filter>
        </defs>

        {/* subtle mow-stripe overlay (alternating light bands) */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect
            key={i}
            x={0} y={i * (svgH / 10)}
            width={W} height={svgH / 10}
            fill={i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent'}
          />
        ))}

        {/* field markings — rendered in a group offset by GOAL_H so goals sit above */}
        <g transform={`translate(0, ${GOAL_H})`}>
          <FieldMarkings />
          {hasPlayers
            ? active.map((player, i) => (
                <PlayerToken key={player.name} player={player} slot={SLOTS[i]} />
              ))
            : <EmptyState />
          }
        </g>
      </svg>
    </div>
  );
}

export default FormationBoard;
