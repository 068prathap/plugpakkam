'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './TownSearch.module.css';

const emptyResults = { query: '', spots: [], towns: [], others: [] };

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" fill="currentColor" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6l.5-7.5Z" fill="currentColor" />
    </svg>
  );
}

function TownSearch({ t, lang, onPick, onPickSpot, compact }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(emptyResults);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data) => setResults({ query: trimmed, ...data }))
        .catch(() => {});
    }, 220);

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

  const ready = trimmed.length >= 2 && results.query === trimmed;
  const spots = ready && onPickSpot ? results.spots : [];
  const towns = ready ? results.towns : [];
  const others = ready ? results.others : [];
  const items = [
    ...spots.map((spot) => ({ type: 'spot', key: `s-${spot.id}`, title: spot.name, sub: spot.area, value: spot })),
    ...towns.map((town) => ({
      type: 'place',
      key: `t-${town.name}-${town.lat}`,
      title: lang === 'ta' && town.ta ? town.ta : town.name,
      sub: [lang === 'ta' ? town.name : town.ta, town.area].filter(Boolean).join(' · '),
      value: town,
    })),
    ...others.map((other) => ({ type: 'place', key: `o-${other.name}-${other.lat}`, title: other.name, sub: other.area, value: other })),
  ];
  const showList = open && ready;

  function pick(item) {
    setQuery('');
    setOpen(false);
    setActive(0);
    inputRef.current?.blur();
    if (item.type === 'spot') onPickSpot(item.value);
    else onPick({ lat: item.value.lat, lng: item.value.lng, label: item.title });
  }

  function handleKey(event) {
    if (event.key === 'Escape') setOpen(false);
    if (!showList || items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((active + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((active - 1 + items.length) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(items[active]);
    }
  }

  let index = -1;

  return (
    <div className={`${styles.search} ${compact ? styles.compact : ''}`} ref={boxRef}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={styles.icon}>
        <path d="M10.5 3a7.5 7.5 0 0 1 5.96 12.05l4.25 4.24-1.42 1.42-4.24-4.25A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="currentColor" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        value={query}
        placeholder={t.finder.search}
        aria-label={t.finder.search}
        role="combobox"
        aria-expanded={showList}
        aria-controls="search-results"
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
        <div id="search-results" role="listbox" className={styles.results}>
          {items.length === 0 && <p className={styles.none}>{t.finder.noMatch}</p>}
          {[
            { label: t.finder.chargingPlaces, list: items.filter((item) => item.type === 'spot') },
            { label: t.finder.places, list: items.filter((item) => item.type === 'place') },
          ]
            .filter(({ list }) => list.length > 0)
            .map(({ label, list }) => (
              <div key={label} className={styles.group}>
                <p className={styles.groupLabel}>{label}</p>
                {list.map((item) => {
                  index += 1;
                  const position = index;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="option"
                      aria-selected={position === active}
                      className={`${position === active ? styles.active : ''} ${item.type === 'spot' ? styles.spot : ''}`}
                      onMouseEnter={() => setActive(position)}
                      onClick={() => pick(item)}
                    >
                      {item.type === 'spot' ? <BoltIcon /> : <PinIcon />}
                      <span>
                        <b>{item.title}</b>
                        {item.sub && <small>{item.sub}</small>}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default TownSearch;
