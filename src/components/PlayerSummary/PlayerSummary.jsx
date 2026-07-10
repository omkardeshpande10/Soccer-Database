import React from 'react';
import { Tile } from '@carbon/react';
import buildSummary from '../../utils/buildSummary';
import './PlayerSummary.scss';

function PlayerSummary({ player }) {
  if (!player) return null;

  const summary = buildSummary(player);

  return (
    <Tile className="player-summary">
      <h3 className="player-summary__label">Player Summary</h3>
      <p className="player-summary__text">{summary}</p>
      <p className="player-summary__source">This summary is based only on the loaded dataset.</p>
    </Tile>
  );
}

export default PlayerSummary;
