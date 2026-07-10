/**
 * Builds a grounded plain-text summary from player dataset fields only.
 * No external data sources are used.
 */
function formDescription(rating) {
  if (rating == null) return null;
  if (rating >= 8.0) return 'in strong form';
  if (rating >= 6.0) return 'showing consistent form';
  return 'building form';
}

function buildSummary(player) {
  if (!player) return '';

  const { name, position, age, citizenship, club, rating } = player;

  const parts = [];

  // Opening sentence — name + position + club
  if (name) {
    let opening = name;
    if (position) opening += ` is a ${position}`;
    if (club)     opening += ` playing for ${club}`;
    parts.push(opening + '.');
  }

  // Age + nationality sentence
  const agePart         = age        ? `${age} years old` : null;
  const nationalityPart = citizenship ? `${citizenship}` : null;

  if (agePart && nationalityPart) {
    parts.push(`They are ${agePart} and ${nationalityPart}.`);
  } else if (agePart) {
    parts.push(`They are ${agePart}.`);
  } else if (nationalityPart) {
    parts.push(`They are ${nationalityPart}.`);
  }

  // Form sentence
  const form = formDescription(rating);
  if (form) {
    parts.push(`Based on recent statistics, they are ${form}.`);
  }

  // Closing disclaimer
  parts.push('This profile is based on the available dataset only.');

  return parts.join(' ');
}

export default buildSummary;
