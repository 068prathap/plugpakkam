'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './TownSearch.module.css';

function TownSearch({ t, lang, label, onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ query: '', places: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data) => setResults({ query: trimmed, places: data.places }))
        .catch(() => {});
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  useEffect(() => {
    function closeOnOutside(event) {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, []);

  const places = trimmed.length >= 2 && results.query === trimmed ? results.places : [];
  const showList = open && trimmed.length >= 2 && results.query === trimmed;

  function placeName(place) {
    return lang === 'ta' && place.ta ? place.ta : place.name;
  }

  function pick(place) {
    setQuery('');
    setOpen(false);
    setActive(0);
    onPick({ lat: place.lat, lng: place.lng, label: placeName(place) });
  }

  function handleKey(event) {
    if (!showList || places.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((active + 1) % places.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((active - 1 + places.length) % places.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(places[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className={styles.search} ref={boxRef}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={styles.icon}>
        <path d="M10.5 3a7.5 7.5 0 0 1 5.96 12.05l4.25 4.24-1.42 1.42-4.24-4.25A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="currentColor" />
      </svg>
      <input
        type="search"
        value={query}
        placeholder={label || t.finder.search}
        aria-label={t.finder.search}
        role="combobox"
        aria-expanded={showList}
        aria-controls="town-results"
        aria-autocomplete="list"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={handleKey}
      />

      {showList && (
        <ul id="town-results" role="listbox" className={styles.results}>
          {places.length === 0 && <li className={styles.none}>{t.finder.noMatch}</li>}
          {places.map((place, index) => (
            <li key={`${place.name}-${place.lat}`} role="option" aria-selected={index === active}>
              <button type="button" className={index === active ? styles.active : ''} onMouseEnter={() => setActive(index)} onClick={() => pick(place)}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="currentColor" />
                </svg>
                <span>
                  <b>{placeName(place)}</b>
                  <small>{[lang === 'ta' ? place.name : place.ta, place.area].filter(Boolean).join(' · ')}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TownSearch;
