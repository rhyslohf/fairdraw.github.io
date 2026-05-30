import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Seeded PRNG ──────────────────────────────────────────────────────── */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h >>> 0;
}
function computeDraw(names) {
  if (!names.length) return null;
  const seed = djb2(names.join("\x00"));
  const rng = mulberry32(seed);
  const idx = Math.floor(rng() * names.length);
  return { idx, seed: seed.toString(16).toUpperCase().padStart(8, "0") };
}

/* ─── URL persistence ──────────────────────────────────────────────────── */
function encodeNames(names) {
  if (!names.length) return "";
  return btoa(unescape(encodeURIComponent(names.join("\n"))));
}
function decodeNames(raw) {
  try { return decodeURIComponent(escape(atob(raw))).split("\n").filter(Boolean); }
  catch { return []; }
}
function readUrl() {
  const p = new URLSearchParams(window.location.search);
  const raw = p.get("d");
  return raw ? decodeNames(raw) : [];
}
function writeUrl(names) {
  const url = new URL(window.location.href);
  if (names.length) url.searchParams.set("d", encodeNames(names));
  else url.searchParams.delete("d");
  window.history.replaceState(null, "", url.toString());
}

/* ─── Styles ───────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ── Brand palette ── */
    --alabaster-grey: #e8e8e8;
    --silver:         #bfbfbf;
    --rosy-granite:   #96939b;
    --vintage-grape:  #564256;
    --coral-glow:     #fc814a;

    /* ── Semantic tokens ── */
    --bg:      var(--alabaster-grey);
    --surface: #ffffff;
    --border:  var(--silver);
    --text:    var(--vintage-grape);
    --muted:   var(--rosy-granite);
    --accent:  var(--coral-glow);
    --radius:  10px;

    --font-sans:  'DM Sans', system-ui, sans-serif;
    --font-serif: 'DM Serif Display', Georgia, serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 15px;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    max-width: 520px;
    margin: 0 auto;
    padding: 28px 16px 72px;
  }

  /* ── Header ── */
  .header {
    margin-bottom: 28px;
  }
  .header h1 {
    font-family: var(--font-serif);
    font-size: clamp(1.9rem, 7vw, 2.6rem);
    color: var(--vintage-grape);
    line-height: 1.1;
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .header h1 em {
    color: var(--accent);
    font-style: italic;
  }
  .header p {
    margin-top: 5px;
    font-size: 13px;
    color: var(--muted);
    line-height: 1.4;
  }

  /* ── Input row ── */
  .input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .input-row input {
    flex: 1;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: 15px;
    padding: 12px 14px;
    outline: none;
    transition: border-color 0.15s;
  }
  .input-row input::placeholder { color: var(--muted); }
  .input-row input:focus { border-color: var(--accent); }
  .btn-add {
    background: var(--accent);
    border: none;
    border-radius: var(--radius);
    color: #fff;
    cursor: pointer;
    font-size: 22px;
    font-weight: 300;
    line-height: 1;
    width: 48px;
    flex-shrink: 0;
    transition: opacity 0.15s, transform 0.1s;
  }
  .btn-add:hover { opacity: 0.88; }
  .btn-add:active { transform: scale(0.93); }

  /* ── Divider label ── */
  .section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .section-label button {
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    padding: 2px 0;
    transition: color 0.15s;
    letter-spacing: 0;
    text-transform: none;
  }
  .section-label button:hover { color: var(--accent); }

  /* ── Person list ── */
  .person-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 20px;
    min-height: 4px;
  }

  .person-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 10px 10px 4px;
    transition: border-color 0.2s, box-shadow 0.2s;
    cursor: default;
    user-select: none;
  }
  .person-item.is-winner {
    border-color: var(--accent);
    background: hsla(19, 97%, 64%, 0.06);
  }
  .person-item.dragging {
    opacity: 0.4;
  }
  .person-item.drag-over {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px hsla(19, 97%, 64%, 0.18);
  }

  .drag-handle {
    cursor: grab;
    color: var(--silver);
    font-size: 14px;
    padding: 4px 6px;
    display: flex;
    flex-direction: column;
    gap: 2.5px;
    flex-shrink: 0;
    border-radius: 5px;
    transition: color 0.15s, background 0.15s;
    touch-action: none;
  }
  .drag-handle:hover { color: var(--muted); background: var(--bg); }
  .drag-handle span {
    display: block;
    width: 14px;
    height: 2px;
    background: currentColor;
    border-radius: 2px;
  }

  .pos-badge {
    font-size: 12px;
    color: var(--muted);
    width: 20px;
    text-align: right;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
  .person-item.is-winner .pos-badge { color: var(--accent); }

  .person-name {
    flex: 1;
    font-size: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }
  .person-item.is-winner .person-name { font-weight: 600; }

  .winner-icon { font-size: 15px; flex-shrink: 0; }

  .btn-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--silver);
    font-size: 16px;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;
    line-height: 1;
  }
  .btn-remove:hover { background: var(--bg); color: #cc4444; }

  /* ── Empty ── */
  .empty-state {
    text-align: center;
    padding: 36px 16px;
    color: var(--muted);
    font-size: 13px;
    border: 1.5px dashed var(--border);
    border-radius: var(--radius);
    margin-bottom: 20px;
  }

  /* ── Draw button ── */
  .btn-draw {
    width: 100%;
    background: var(--accent);
    border: none;
    border-radius: var(--radius);
    color: #fff;
    cursor: pointer;
    font-family: var(--font-serif);
    font-size: 1.2rem;
    font-style: italic;
    padding: 15px;
    transition: opacity 0.15s, transform 0.1s;
    margin-bottom: 20px;
  }
  .btn-draw:hover:not(:disabled) { opacity: 0.9; }
  .btn-draw:active:not(:disabled) { transform: scale(0.985); }
  .btn-draw:disabled {
    background: var(--border);
    color: var(--muted);
    cursor: not-allowed;
    font-style: normal;
    font-family: var(--font-sans);
    font-size: 14px;
  }

  /* ── Winner card ── */
  .winner-card {
    background: var(--surface);
    border: 2px solid var(--accent);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 16px;
    animation: fadeUp 0.25s ease;
  }
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(6px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .winner-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 4px;
  }
  .winner-name {
    font-family: var(--font-serif);
    font-size: clamp(1.6rem, 6vw, 2.2rem);
    color: var(--vintage-grape);
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .winner-meta {
    font-size: 12px;
    color: var(--muted);
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    align-items: center;
  }
  .seed-chip {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 7px;
    font-size: 11px;
    font-family: monospace;
    color: var(--rosy-granite);
  }

  /* ── Actions ── */
  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .btn-secondary {
    flex: 1;
    min-width: 110px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    padding: 10px 14px;
    display: flex; align-items: center; justify-content: center;
    gap: 6px;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .btn-secondary:hover { border-color: var(--accent); background: hsla(19, 97%, 64%, 0.06); }
  .btn-secondary.ok { border-color: var(--accent); color: var(--accent); }
  .btn-secondary.destructive:hover { border-color: #cc4444; background: #fff5f5; color: #cc4444; }

  /* ── How it works (collapsible) ── */
  .how-section { margin-top: 4px; }
  .btn-how {
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 12px;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    transition: color 0.15s;
  }
  .btn-how:hover { color: var(--vintage-grape); }
  .how-chevron { font-size: 10px; transition: transform 0.2s; }
  .how-chevron.open { transform: rotate(180deg); }
  .how-body {
    margin-top: 10px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.7;
    animation: fadeUp 0.2s ease;
  }
  .how-body code {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 0px 5px;
    font-size: 11.5px;
    color: var(--vintage-grape);
  }

  /* ── Toast ── */
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--vintage-grape);
    color: var(--alabaster-grey);
    border-radius: 20px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 500;
    pointer-events: none;
    z-index: 999;
    white-space: nowrap;
    animation: toastIn 0.2s ease, toastOut 0.2s ease 1.8s forwards;
  }
  @keyframes toastIn  { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
  @keyframes toastOut { to   { opacity:0; transform: translateX(-50%) translateY(8px); } }

  @media (max-width: 420px) {
    .actions { flex-direction: column; }
    .btn-secondary { min-width: unset; }
  }
`;

/* ─── Drag and drop hook ─────────────────────────────────────────────────── */
function useDragSort(names, setNames) {
  const dragging = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  // Mouse/pointer events
  const onDragStart = (idx) => { dragging.current = idx; };
  const onDragEnter = (idx) => { if (dragging.current !== idx) setOverIdx(idx); };
  const onDragEnd   = () => { setOverIdx(null); dragging.current = null; };
  const onDrop      = (idx) => {
    const from = dragging.current;
    if (from == null || from === idx) { onDragEnd(); return; }
    setNames(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(idx, 0, item);
      return next;
    });
    onDragEnd();
  };

  // Touch events
  const touchState = useRef({ startY: 0, idx: null });
  const onTouchStart = (e, idx) => {
    touchState.current = { startY: e.touches[0].clientY, idx };
    dragging.current = idx;
  };
  const onTouchMove  = (e) => {
    e.preventDefault();
    const y = e.touches[0].clientY;
    const el = document.elementFromPoint(e.touches[0].clientX, y);
    const li = el?.closest("[data-idx]");
    if (li) {
      const targetIdx = parseInt(li.dataset.idx, 10);
      if (!isNaN(targetIdx) && targetIdx !== dragging.current) setOverIdx(targetIdx);
    }
  };
  const onTouchEnd = () => {
    if (overIdx != null && dragging.current != null && overIdx !== dragging.current) {
      const from = dragging.current;
      const to   = overIdx;
      setNames(prev => {
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
    }
    onDragEnd();
  };

  return { overIdx, onDragStart, onDragEnter, onDragEnd, onDrop, onTouchStart, onTouchMove, onTouchEnd };
}

/* ─── App ────────────────────────────────────────────────────────────────── */
export default function FairDraw() {
  const [names,       setNames]       = useState(() => readUrl());
  const [input,       setInput]       = useState("");
  const [result,      setResult]      = useState(null);
  const [drawn,       setDrawn]       = useState(false);
  const [showHow,     setShowHow]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [copyOk,      setCopyOk]      = useState(false);
  const inputRef  = useRef(null);
  const toastRef  = useRef(null);

  // Keep URL in sync; reset draw when list changes
  useEffect(() => { writeUrl(names); setDrawn(false); setResult(null); }, [names]);

  const showToast = useCallback((msg) => {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const addName = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    setNames(p => [...p, t]);
    setInput("");
    inputRef.current?.focus();
  }, [input]);

  const removeName = useCallback((idx) => setNames(p => p.filter((_, i) => i !== idx)), []);

  const draw = useCallback(() => {
    const r = computeDraw(names);
    if (!r) return;
    setResult(r);
    setDrawn(true);
  }, [names]);

  const copyLink = useCallback(async () => {
    // Make sure URL reflects current state before copying
    writeUrl(names);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyOk(true);
      showToast("Link copied!");
      setTimeout(() => setCopyOk(false), 2200);
    } catch { showToast("Couldn't copy — please copy the URL manually"); }
  }, [names, showToast]);

  const clearAll = useCallback(() => { setNames([]); setInput(""); }, []);

  const { overIdx, onDragStart, onDragEnter, onDragEnd, onDrop,
          onTouchStart, onTouchMove, onTouchEnd } = useDragSort(names, setNames);

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Header */}
        <header className="header">
          <h1>Fair <em>Draw</em></h1>
          <p>Add names in entry order, then draw a verifiable random winner.</p>
        </header>

        {/* Input */}
        <div className="input-row">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a name…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addName()}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn-add" onClick={addName} aria-label="Add name">+</button>
        </div>

        {/* List header */}
        {names.length > 0 && (
          <div className="section-label">
            <span>{names.length} {names.length === 1 ? "person" : "people"} — drag to reorder</span>
            <button onClick={clearAll}>Clear all</button>
          </div>
        )}

        {/* List */}
        {names.length === 0 ? (
          <div className="empty-state">No names yet — add someone above</div>
        ) : (
          <ul className="person-list">
            {names.map((name, i) => (
              <li
                key={i}
                data-idx={i}
                className={[
                  "person-item",
                  drawn && result?.idx === i ? "is-winner" : "",
                  overIdx === i ? "drag-over" : "",
                ].filter(Boolean).join(" ")}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(i)}
              >
                <div
                  className="drag-handle"
                  onTouchStart={e => onTouchStart(e, i)}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  aria-label="Drag to reorder"
                >
                  <span /><span /><span />
                </div>
                <span className="pos-badge">{i + 1}</span>
                <span className="person-name">{name}</span>
                {drawn && result?.idx === i && <span className="winner-icon">🏆</span>}
                <button className="btn-remove" onClick={() => removeName(i)} aria-label="Remove">×</button>
              </li>
            ))}
          </ul>
        )}

        {/* Draw */}
        <button
          className="btn-draw"
          onClick={draw}
          disabled={names.length < 2}
        >
          {names.length < 2 ? "Add at least 2 people to draw" : "Draw a winner"}
        </button>

        {/* Winner card */}
        {drawn && result && (
          <div className="winner-card">
            <div className="winner-label">Winner</div>
            <div className="winner-name">{names[result.idx]}</div>
            <div className="winner-meta">
              <span>#{result.idx + 1} of {names.length}</span>
              <span className="seed-chip">seed 0x{result.seed}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {names.length > 0 && (
          <div className="actions">
            <button
              className={`btn-secondary${copyOk ? " ok" : ""}`}
              onClick={copyLink}
            >
              {copyOk ? "✓ Copied!" : "⎘ Share link"}
            </button>
            {drawn && (
              <button className="btn-secondary" onClick={draw}>
                ↻ Redraw
              </button>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="how-section">
          <button className="btn-how" onClick={() => setShowHow(v => !v)}>
            How is the result determined?
            <span className={`how-chevron${showHow ? " open" : ""}`}>▾</span>
          </button>
          {showHow && (
            <div className="how-body">
              Names in their entered order are joined and hashed with <code>djb2</code> to produce a numeric seed. That seed drives a <code>mulberry32</code> PRNG — the first value, scaled to the list length, selects the winner. The same ordered list always produces the same seed and the same result, so the outcome is fully transparent and reproducible by anyone with the share link.
            </div>
          )}
        </div>

      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}