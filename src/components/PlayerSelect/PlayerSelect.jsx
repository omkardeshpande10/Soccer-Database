import React from 'react';
import { Select, SelectItem } from '@carbon/react';

function PlayerSelect({ players, selectedName, onChange }) {
  return (
    <Select
      id="player-select"
      labelText="Player"
      value={selectedName}
      onChange={(e) => onChange(e.target.value)}
    >
      <SelectItem value="" text="Select a player..." />
      {players.map((player) => (
        <SelectItem
          key={player.name}
          value={player.name}
          text={player.name}
        />
      ))}
    </Select>
  );
}

export default PlayerSelect;
