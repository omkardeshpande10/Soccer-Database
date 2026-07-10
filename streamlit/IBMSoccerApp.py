import json
import math
import random
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

# ─── page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Player Dashboard",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── session state defaults (must be set before any widget) ───────────────────
if "team" not in st.session_state:
    st.session_state["team"] = []

# ─── load data ────────────────────────────────────────────────────────────────
DATA_PATH = Path(__file__).parent.parent / "src" / "data" / "players.json"

@st.cache_data
def load_players():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

players = load_players()

# ─── helpers ──────────────────────────────────────────────────────────────────

def form_description(rating):
    if rating is None:
        return None
    if rating >= 8.0:
        return "in strong form"
    if rating >= 6.0:
        return "showing consistent form"
    return "building form"


def build_summary(player):
    if not player:
        return ""
    parts = []

    name       = player.get("name", "")
    position   = player.get("position", "")
    club       = player.get("club", "")
    age        = player.get("age")
    citizenship = player.get("citizenship", "")
    rating     = player.get("rating")

    # Opening sentence
    if name:
        opening = name
        if position:
            opening += f" is a {position}"
        if club:
            opening += f" playing for {club}"
        parts.append(opening + ".")

    # Age + nationality
    age_part  = f"{age} years old" if age else None
    nat_part  = citizenship if citizenship else None
    if age_part and nat_part:
        parts.append(f"They are {age_part} and {nat_part}.")
    elif age_part:
        parts.append(f"They are {age_part}.")
    elif nat_part:
        parts.append(f"They are {nat_part}.")

    # Form
    form = form_description(rating)
    if form:
        parts.append(f"Based on recent statistics, they are {form}.")

    parts.append("This profile is based on the available dataset only.")
    return " ".join(parts)


def format_rating(rating):
    if rating is None:
        return "—"
    return f"{rating:.1f} / 10"


def pick_random_11(pool):
    return random.sample(pool, 11)


# ─── formation board SVG ──────────────────────────────────────────────────────

W       = 640
H       = 920
M       = 32
FX      = M
FY      = M
FW      = W - M * 2
FH      = H - M * 2

PB_W    = FW * 0.60
PB_H    = FH * 0.168
GA_W    = FW * 0.308
GA_H    = FH * 0.057
CC_R    = FH * 0.091
PS_D    = FH * 0.108
ARC_R   = CC_R
CORNER_R = FH * 0.010
GOAL_W  = FW * 0.178
GOAL_H  = 12

CX      = FX + FW / 2
CY      = FY + FH / 2
PBX     = CX - PB_W / 2
GAX     = CX - GA_W / 2
GOALX   = CX - GOAL_W / 2

AVATAR_R = 28

FORMATION_ROWS = [
    {"y": 0.09, "count": 2},   # forwards
    {"y": 0.32, "count": 4},   # midfielders
    {"y": 0.60, "count": 4},   # defenders
    {"y": 0.88, "count": 1},   # goalkeeper
]


def formation_slots():
    slots = []
    squad_no = 1
    for row in FORMATION_ROWS:
        count = row["count"]
        y_frac = row["y"]
        step = 1 / (count + 1)
        for i in range(1, count + 1):
            slots.append({
                "x": FX + step * i * FW,
                "y": FY + y_frac * FH,
                "squadNo": squad_no,
            })
            squad_no += 1
    return slots


SLOTS = formation_slots()


def svg_field_markings():
    lines = []
    mk = 'fill="none" stroke="white" stroke-width="1.8"'

    top_spot_y    = FY + PS_D
    bot_spot_y    = FY + FH - PS_D
    top_box_edge  = FY + PB_H
    bot_box_edge  = FY + FH - PB_H

    top_dist = top_box_edge - top_spot_y
    bot_dist = bot_spot_y  - bot_box_edge

    top_hc = math.sqrt(max(0, ARC_R**2 - top_dist**2))
    bot_hc = math.sqrt(max(0, ARC_R**2 - bot_dist**2))

    top_arc = (f"M {CX - top_hc:.2f} {top_box_edge:.2f} "
               f"A {ARC_R:.2f} {ARC_R:.2f} 0 0 0 {CX + top_hc:.2f} {top_box_edge:.2f}")
    bot_arc = (f"M {CX - bot_hc:.2f} {bot_box_edge:.2f} "
               f"A {ARC_R:.2f} {ARC_R:.2f} 0 0 1 {CX + bot_hc:.2f} {bot_box_edge:.2f}")

    net = 'stroke="rgba(255,255,255,0.4)" stroke-width="0.8"'

    # top goal
    lines.append(f'<rect x="{GOALX:.2f}" y="{FY - GOAL_H:.2f}" width="{GOAL_W:.2f}" height="{GOAL_H}" '
                 f'fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="1.8"/>')
    for i in [1, 2, 3]:
        nx = GOALX + (GOAL_W / 4) * i
        lines.append(f'<line x1="{nx:.2f}" y1="{FY - GOAL_H:.2f}" x2="{nx:.2f}" y2="{FY:.2f}" {net}/>')
    lines.append(f'<line x1="{GOALX:.2f}" y1="{FY - GOAL_H/2:.2f}" '
                 f'x2="{GOALX + GOAL_W:.2f}" y2="{FY - GOAL_H/2:.2f}" {net}/>')

    # bottom goal
    lines.append(f'<rect x="{GOALX:.2f}" y="{FY + FH:.2f}" width="{GOAL_W:.2f}" height="{GOAL_H}" '
                 f'fill="rgba(255,255,255,0.15)" stroke="white" stroke-width="1.8"/>')
    for i in [1, 2, 3]:
        nx = GOALX + (GOAL_W / 4) * i
        lines.append(f'<line x1="{nx:.2f}" y1="{FY + FH:.2f}" x2="{nx:.2f}" y2="{FY + FH + GOAL_H:.2f}" {net}/>')
    lines.append(f'<line x1="{GOALX:.2f}" y1="{FY + FH + GOAL_H/2:.2f}" '
                 f'x2="{GOALX + GOAL_W:.2f}" y2="{FY + FH + GOAL_H/2:.2f}" {net}/>')

    # field border
    lines.append(f'<rect x="{FX}" y="{FY}" width="{FW:.2f}" height="{FH:.2f}" {mk}/>')
    # halfway line
    lines.append(f'<line x1="{FX}" y1="{CY:.2f}" x2="{FX + FW:.2f}" y2="{CY:.2f}" {mk}/>')
    # centre circle + spot
    lines.append(f'<circle cx="{CX:.2f}" cy="{CY:.2f}" r="{CC_R:.2f}" {mk}/>')
    lines.append(f'<circle cx="{CX:.2f}" cy="{CY:.2f}" r="3" fill="white"/>')

    # top penalty area
    lines.append(f'<rect x="{PBX:.2f}" y="{FY}" width="{PB_W:.2f}" height="{PB_H:.2f}" {mk}/>')
    lines.append(f'<rect x="{GAX:.2f}" y="{FY}" width="{GA_W:.2f}" height="{GA_H:.2f}" {mk}/>')
    lines.append(f'<circle cx="{CX:.2f}" cy="{top_spot_y:.2f}" r="2.5" fill="white"/>')
    lines.append(f'<path d="{top_arc}" {mk}/>')

    # bottom penalty area
    lines.append(f'<rect x="{PBX:.2f}" y="{FY + FH - PB_H:.2f}" width="{PB_W:.2f}" height="{PB_H:.2f}" {mk}/>')
    lines.append(f'<rect x="{GAX:.2f}" y="{FY + FH - GA_H:.2f}" width="{GA_W:.2f}" height="{GA_H:.2f}" {mk}/>')
    lines.append(f'<circle cx="{CX:.2f}" cy="{bot_spot_y:.2f}" r="2.5" fill="white"/>')
    lines.append(f'<path d="{bot_arc}" {mk}/>')

    # corner arcs
    cr = CORNER_R
    lines.append(f'<path d="M {FX} {FY+cr:.2f} A {cr:.2f} {cr:.2f} 0 0 0 {FX+cr:.2f} {FY}" {mk}/>')
    lines.append(f'<path d="M {FX+FW-cr:.2f} {FY} A {cr:.2f} {cr:.2f} 0 0 0 {FX+FW:.2f} {FY+cr:.2f}" {mk}/>')
    lines.append(f'<path d="M {FX} {FY+FH-cr:.2f} A {cr:.2f} {cr:.2f} 0 0 1 {FX+cr:.2f} {FY+FH:.2f}" {mk}/>')
    lines.append(f'<path d="M {FX+FW-cr:.2f} {FY+FH:.2f} A {cr:.2f} {cr:.2f} 0 0 1 {FX+FW:.2f} {FY+FH-cr:.2f}" {mk}/>')

    return "\n".join(lines)


def svg_player_token(player, slot, idx):
    px, py, squad_no = slot["x"], slot["y"], slot["squadNo"]
    name = player.get("name", "")
    display_name = name[:12] + "…" if len(name) > 13 else name
    photo = player.get("photo", "")
    clip_id = f"clip-{idx}"

    return f"""
  <defs>
    <clipPath id="{clip_id}">
      <circle cx="{px:.2f}" cy="{py:.2f}" r="{AVATAR_R}"/>
    </clipPath>
  </defs>
  <circle cx="{px:.2f}" cy="{py+1:.2f}" r="{AVATAR_R+3}" fill="rgba(0,0,0,0.25)"/>
  <circle cx="{px:.2f}" cy="{py:.2f}" r="{AVATAR_R+2.5}" fill="white"/>
  <image href="{photo}" x="{px-AVATAR_R:.2f}" y="{py-AVATAR_R:.2f}"
         width="{AVATAR_R*2}" height="{AVATAR_R*2}"
         clip-path="url(#{clip_id})" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="{px+AVATAR_R-6:.2f}" cy="{py-AVATAR_R+6:.2f}" r="10"
          fill="#1a3fd4" stroke="white" stroke-width="1.5"/>
  <text x="{px+AVATAR_R-6:.2f}" y="{py-AVATAR_R+11:.2f}"
        text-anchor="middle" font-size="9" font-weight="bold" fill="white">{squad_no}</text>
  <text x="{px:.2f}" y="{py+AVATAR_R+17:.2f}"
        text-anchor="middle" font-size="12" font-weight="700"
        fill="white" stroke="rgba(0,0,0,0.85)" stroke-width="3" paint-order="stroke">{display_name}</text>
"""


def build_formation_svg(team_players):
    svg_h = H + GOAL_H * 2

    # mow stripes
    stripes = ""
    for i in range(10):
        fill = "rgba(255,255,255,0.04)" if i % 2 == 0 else "transparent"
        stripes += f'<rect x="0" y="{i*(svg_h/10):.2f}" width="{W}" height="{svg_h/10:.2f}" fill="{fill}"/>\n'

    markings = svg_field_markings()

    if len(team_players) >= 11:
        tokens = ""
        for i, player in enumerate(team_players[:11]):
            tokens += svg_player_token(player, SLOTS[i], i + 1)
        players_svg = tokens
    else:
        # empty state
        players_svg = f"""
  <rect x="{CX-190:.2f}" y="{CY-28:.2f}" width="380" height="56" rx="8" fill="rgba(0,0,0,0.50)"/>
  <text x="{CX:.2f}" y="{CY+6:.2f}" text-anchor="middle" font-size="13"
        fill="white" font-weight="500">Click Generate Random Team to see the formation</text>
"""

    return f"""
<svg xmlns="http://www.w3.org/2000/svg"
     width="{W}" height="{svg_h}"
     viewBox="0 0 {W} {svg_h}"
     style="display:block; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.40);">
  <defs>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#3aaa5c"/>
      <stop offset="18%"  stop-color="#2e9950"/>
      <stop offset="36%"  stop-color="#38a858"/>
      <stop offset="54%"  stop-color="#2e9950"/>
      <stop offset="72%"  stop-color="#38a858"/>
      <stop offset="90%"  stop-color="#2e9950"/>
      <stop offset="100%" stop-color="#3aaa5c"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{svg_h}" fill="url(#grass)"/>
  {stripes}
  <g transform="translate(0, {GOAL_H})">
    {markings}
    {players_svg}
  </g>
</svg>
"""


# ─── page styles ──────────────────────────────────────────────────────────────
st.markdown("""
<style>
  .main .block-container { max-width: 1300px; padding-top: 2rem; }
  h1 { font-size: 2rem; font-weight: 600; margin-bottom: 1.5rem; }
  .card {
    background: #f7f8fa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .card h2 { font-size: 1.15rem; font-weight: 600; margin: 0.5rem 0 1rem; text-align: center; }
  .card h3 { font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
             letter-spacing: 0.05em; color: #57606a; margin-bottom: 0.5rem; }
  .player-photo {
    display: block; margin: 0 auto 0.75rem;
    width: 120px; height: 120px;
    border-radius: 50%; object-fit: cover;
    border: 2px solid #e5e7eb;
  }
  .stat-row {
    display: flex; justify-content: space-between;
    padding: 0.4rem 0; border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }
  .stat-row:last-child { border-bottom: none; }
  .stat-label { color: #57606a; font-weight: 600; }
  .summary-text { font-size: 0.9375rem; line-height: 1.6; margin-bottom: 0.5rem; }
  .summary-source { font-size: 0.75rem; color: #57606a; }
</style>
""", unsafe_allow_html=True)

# ─── layout ───────────────────────────────────────────────────────────────────
st.title("Player Dashboard")

left_col, right_col = st.columns([1, 1.6], gap="large")

# ── left panel ────────────────────────────────────────────────────────────────
with left_col:
    player_names = [p["name"] for p in players]
    selected_name = st.selectbox(
        "Player",
        options=[""] + player_names,
        format_func=lambda x: "Select a player..." if x == "" else x,
    )

    selected_player = next((p for p in players if p["name"] == selected_name), None)

    if selected_player:
        # player card
        photo = selected_player.get("photo", "")
        rating = selected_player.get("rating")

        card_html = f"""
<div class="card">
  {'<img class="player-photo" src="' + photo + '" alt="' + selected_player.get("name","") + '"/>' if photo else ''}
  <h2>{selected_player.get("name", "")}</h2>
  <div class="stat-row"><span class="stat-label">Position</span><span>{selected_player.get("position") or "—"}</span></div>
  <div class="stat-row"><span class="stat-label">Age</span><span>{selected_player.get("age") or "—"}</span></div>
  <div class="stat-row"><span class="stat-label">Nationality</span><span>{selected_player.get("citizenship") or "—"}</span></div>
  <div class="stat-row"><span class="stat-label">Club</span><span>{selected_player.get("club") or "—"}</span></div>
  <div class="stat-row"><span class="stat-label">Form rating</span><span>{format_rating(rating)}</span></div>
</div>
"""
        st.markdown(card_html, unsafe_allow_html=True)

        # player summary
        summary = build_summary(selected_player)
        summary_html = f"""
<div class="card">
  <h3>Player Summary</h3>
  <p class="summary-text">{summary}</p>
  <p class="summary-source">This summary is based only on the loaded dataset.</p>
</div>
"""
        st.markdown(summary_html, unsafe_allow_html=True)

# ── right panel ───────────────────────────────────────────────────────────────
with right_col:
    if st.button("⚽  Generate Random Team", type="primary", use_container_width=True):
        st.session_state["team"] = pick_random_11(players)
        st.rerun()

    team = st.session_state["team"]
    svg = build_formation_svg(team)
    svg_h = 920 + 12 * 2 + 20   # H + GOAL_H*2 + small buffer
    components.html(svg, height=svg_h, scrolling=False)
