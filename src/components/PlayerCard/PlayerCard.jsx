import React from 'react';
import { Tile } from '@carbon/react';
import './PlayerCard.scss';

const STATS = [
  { label: 'Position',   key: 'position' },
  { label: 'Age',        key: 'age' },
  { label: 'Nationality', key: 'citizenship' },
  { label: 'Club',       key: 'club' },
];

function formatRating(rating) {
  if (rating == null) return '—';
  return `${rating.toFixed(1)} / 10`;
}

function PlayerCard({ player }) {
  if (!player) return null;

  return (
    <Tile className="player-card">
      {player.photo && (
        <div className="player-card__photo-wrapper">
          <img
            src={player.photo}
            alt={player.name}
            className="player-card__photo"
          />
        </div>
      )}

      <h2 className="player-card__name">{player.name}</h2>

      <dl className="player-card__stats">
        {STATS.map(({ label, key }) => (
          <div className="player-card__stat-row" key={key}>
            <dt className="player-card__stat-label">{label}</dt>
            <dd className="player-card__stat-value">{player[key] ?? '—'}</dd>
          </div>
        ))}
        <div className="player-card__stat-row">
          <dt className="player-card__stat-label">Form rating</dt>
          <dd className="player-card__stat-value">{formatRating(player.rating)}</dd>
        </div>
      </dl>
    </Tile>
  );
}

export default PlayerCard;
