require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const PREMIER_LEAGUE_ID = 39;
const SEASON = 2023;

// Top Premier League teams with their API-Football team IDs
const TEAMS = [
  { id: 50,  name: 'Manchester City' },
  { id: 33,  name: 'Manchester United' },
  { id: 40,  name: 'Liverpool' },
  { id: 42,  name: 'Arsenal' },
  { id: 49,  name: 'Chelsea' },
  { id: 47,  name: 'Tottenham' },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchTeamPlayers(team) {
  const url = `${BASE_URL}/players?team=${team.id}&season=${SEASON}`;
  const response = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching team ${team.name}`);
  }

  const json = await response.json();

  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API error for team ${team.name}: ${JSON.stringify(json.errors)}`);
  }

  return json.response || [];
}

function extractPlayer(entry) {
  const { player, statistics } = entry;

  if (!statistics || statistics.length === 0) return null;

  // Find Premier League stats specifically
  const plStats = statistics.find((s) => s.league && s.league.id === PREMIER_LEAGUE_ID);
  if (!plStats) return null;

  const rating = plStats.games && plStats.games.rating
    ? parseFloat(plStats.games.rating)
    : null;

  // Convert height string like "185 cm" → 185
  const heightRaw = player.height || '';
  const heightNum = parseInt(heightRaw.replace(/\D/g, ''), 10) || null;

  return {
    name:        player.name,
    photo:       player.photo,
    position:    plStats.games.position || null,
    age:         player.age,
    citizenship: player.nationality,
    height:      heightNum,
    club:        plStats.team.name,
    rating,
  };
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: API_FOOTBALL_KEY is not set in your .env file.');
    process.exit(1);
  }

  // Ensure output directory exists
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created directory: src/data');
  }

  const allPlayers = [];

  for (const team of TEAMS) {
    console.log(`Fetching players for ${team.name}...`);
    try {
      const entries = await fetchTeamPlayers(team);
      const extracted = entries.map(extractPlayer).filter(Boolean);
      console.log(`  → ${extracted.length} players with Premier League stats`);
      allPlayers.push(...extracted);
    } catch (err) {
      console.error(`  ERROR fetching ${team.name}: ${err.message}`);
    }
    await delay(600); // stay within free-plan rate limits
  }

  console.log(`\nTotal players fetched (with duplicates): ${allPlayers.length}`);

  // Remove duplicates by name
  const seen = new Set();
  const unique = allPlayers.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  console.log(`After removing duplicates: ${unique.length} players`);

  const outPath = path.join(dataDir, 'players.json');
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2), 'utf-8');
  console.log(`\n✓ Saved ${unique.length} players to src/data/players.json`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
