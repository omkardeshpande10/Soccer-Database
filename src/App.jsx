import React, { useState } from 'react';
import { Button } from '@carbon/react';
import players from './data/players.json';
import PlayerSelect from './components/PlayerSelect/PlayerSelect';
import PlayerCard from './components/PlayerCard/PlayerCard';
import PlayerSummary from './components/PlayerSummary/PlayerSummary';
import FormationBoard from './components/FormationBoard/FormationBoard';
import './App.scss';

function pickRandom11(pool) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 11);
}

function App() {
  const [selectedName, setSelectedName]   = useState('');
  const [teamPlayers,  setTeamPlayers]    = useState([]);

  const selectedPlayer = players.find((p) => p.name === selectedName) ?? null;

  function handleGenerate() {
    setTeamPlayers(pickRandom11(players));
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Player Dashboard</h1>
      </header>
      <main className="app-main">
        {/* ── left panel: player lookup ── */}
        <section className="app-panel">
          <PlayerSelect
            players={players}
            selectedName={selectedName}
            onChange={setSelectedName}
          />
          <PlayerCard player={selectedPlayer} />
          <PlayerSummary player={selectedPlayer} />
        </section>

        {/* ── right panel: formation board ── */}
        <section className="app-formation">
          <div className="app-formation__toolbar">
            <Button kind="primary" onClick={handleGenerate}>
              Generate Random Team
            </Button>
          </div>
          <FormationBoard players={teamPlayers} />
        </section>
      </main>
    </div>
  );
}

export default App;
