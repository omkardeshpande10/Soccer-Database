import { useState, useEffect } from 'react';

// Extract the first 2-3 sentences from a paragraph of text.
function extractSentences(text, count = 3) {
  if (!text) return '';
  const matches = text.match(/[^.!?]+[.!?]+/g) || [];
  return matches.slice(0, count).join(' ').trim();
}

function useWikiSummary(playerName) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!playerName) {
      setSummary('');
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary('');

    const query = encodeURIComponent(playerName);
    const url =
      `https://en.wikipedia.org/w/api.php` +
      `?action=query&titles=${query}&prop=extracts&exintro=true` +
      `&explaintext=true&redirects=1&format=json&origin=*`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Wikipedia request failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const pages = data?.query?.pages ?? {};
        const page  = Object.values(pages)[0];

        if (!page || page.missing !== undefined || !page.extract) {
          setSummary('');
          setError('No Wikipedia article found for this player.');
          return;
        }

        setSummary(extractSentences(page.extract, 3));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [playerName]);

  return { summary, loading, error };
}

export default useWikiSummary;
