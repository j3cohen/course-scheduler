import React, { useState } from 'react';
import TimeBlocker from './TimeBlocker.jsx';

// Three course states:
//   optional  — may appear in schedules (default)
//   required  — must appear in every schedule (soft lock, toggleable)
//   excluded  — never appears in any schedule
// Clicking a chip cycles: optional → required → excluded → optional

export default function FilterPanel({
  courses,
  minCredits, maxCredits, onCreditChange,
  requiredIds, onRequiredChange,
  excludedIds, onExcludeChange,
  blocked, onBlockedChange,
}) {
  const [open, setOpen] = useState(true);
  const [blockerOpen, setBlockerOpen] = useState(false);

  const optional = courses.filter(c => !c.isFinal && c.sections.length > 0);
  const finals = courses.filter(c => c.isFinal && c.sections.length > 0);
  const blockedCount = blocked.size;
  const requiredCount = optional.filter(c => requiredIds.has(c.id)).length;
  const excludedCount = optional.filter(c => excludedIds.has(c.id)).length;

  function getState(id) {
    if (requiredIds.has(id)) return 'required';
    if (excludedIds.has(id)) return 'excluded';
    return 'optional';
  }

  function cycleCourse(id) {
    const state = getState(id);
    if (state === 'optional') {
      // → required
      onRequiredChange(new Set([...requiredIds, id]));
    } else if (state === 'required') {
      // → excluded
      const nr = new Set(requiredIds); nr.delete(id); onRequiredChange(nr);
      onExcludeChange(new Set([...excludedIds, id]));
    } else {
      // excluded → optional
      const ne = new Set(excludedIds); ne.delete(id); onExcludeChange(ne);
    }
  }

  function resetAll() {
    onRequiredChange(new Set());
    onExcludeChange(new Set());
  }
  function excludeAll() {
    onRequiredChange(new Set());
    onExcludeChange(new Set(optional.map(c => c.id)));
  }

  const summaryParts = [
    `${minCredits}–${maxCredits} cr`,
    requiredCount > 0 ? `${requiredCount} required` : null,
    excludedCount > 0 ? `${excludedCount} excluded` : null,
    blockedCount > 0 ? `${blockedCount} blocked` : null,
  ].filter(Boolean);
  const summary = summaryParts.length ? summaryParts.join(' · ') : 'no filters set';

  return (
    <div style={panel}>
      <button onClick={() => setOpen(o => !o)} style={headerBtn}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)' }}>
            Filters
          </span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{summary}</span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--gray-400)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>

          {/* Credit range */}
          <section>
            <Label>Credit range</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Min</span>
                <input
                  type="number" min={0} max={maxCredits} step={1}
                  value={minCredits}
                  onChange={e => onCreditChange(Math.min(Number(e.target.value), maxCredits), maxCredits)}
                  style={numInput}
                />
              </div>
              <span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>–</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Max</span>
                <input
                  type="number" min={minCredits} max={25} step={1}
                  value={maxCredits}
                  onChange={e => onCreditChange(minCredits, Math.max(Number(e.target.value), minCredits))}
                  style={numInput}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>credits</span>
              <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
                {[[12,15],[14,17],[15,17]].map(([mn,mx]) => (
                  <button key={`${mn}-${mx}`} onClick={() => onCreditChange(mn, mx)} style={presetBtn(minCredits === mn && maxCredits === mx)}>
                    {mn}–{mx}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Course states */}
          {optional.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <Label>Courses</Label>
                  <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                    <Legend color="#16A34A" bg="#DCFCE7" border="#86EFAC" label="★ Required" hint="in every schedule" />
                    <Legend color="var(--navy)" bg="#EEF2FF" border="#818CF8" label="Optional" hint="included if it fits" />
                    <Legend color="var(--gray-500)" bg="var(--gray-100)" border="var(--gray-300)" label="✕ Excluded" hint="never appears" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={resetAll} style={textBtn}>Reset all</button>
                  <button onClick={excludeAll} style={textBtn}>Exclude all</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {optional.map(c => {
                  const state = getState(c.id);
                  return (
                    <button key={c.id} onClick={() => cycleCourse(c.id)} style={courseChip(state)} title={`Click to cycle: optional → required → excluded`}>
                      {state === 'required' && <span style={{ marginRight: 4, fontSize: 11 }}>★</span>}
                      {state === 'excluded' && <span style={{ marginRight: 4, fontSize: 11 }}>✕</span>}
                      <span style={{ fontFamily: 'monospace', fontSize: 11, opacity: 0.8 }}>
                        {c.code}{c.section ? ` ${c.section}` : ''}
                      </span>
                      <span style={{ marginLeft: 5, fontWeight: 600, fontSize: 12 }}>
                        {c.name.length > 26 ? c.name.slice(0, 24) + '…' : c.name}
                      </span>
                      <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>{c.credits}cr</span>
                    </button>
                  );
                })}
              </div>
              {finals.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)', alignSelf: 'center', marginRight: 2 }}>Bank finals:</span>
                  {finals.map(c => (
                    <div key={c.id} style={finalChip}>
                      <span style={{ fontSize: 10, marginRight: 4 }}>🔒</span>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{c.name.length > 24 ? c.name.slice(0, 22) + '…' : c.name}</span>
                      <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>{c.credits}cr</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Time blocker */}
          <section>
            <button onClick={() => setBlockerOpen(o => !o)} style={blockerToggle}>
              <Label>Block time slots{blockedCount > 0 ? ` · ${blockedCount} blocked` : ''}</Label>
              <span style={{ fontSize: 12, color: 'var(--gray-400)', transform: blockerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
            </button>
            {blockerOpen && (
              <div style={{ marginTop: 10 }}>
                <TimeBlocker blocked={blocked} onChange={onBlockedChange} />
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}

function Legend({ color, bg, border, label, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: `1.5px solid ${border}`, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{hint}</span>
    </div>
  );
}

function Label({ children, style }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray-500)', ...style }}>
      {children}
    </div>
  );
}

const panel = {
  background: 'var(--white)', borderRadius: 'var(--radius-lg)',
  border: '1.5px solid var(--gray-200)', marginBottom: 14,
  boxShadow: 'var(--shadow-sm)', padding: '14px 18px',
};
const headerBtn = {
  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
};
const numInput = {
  width: 54, border: '1.5px solid var(--gray-300)', borderRadius: 7,
  padding: '6px 8px', fontSize: 14, textAlign: 'center', fontFamily: 'inherit',
  color: 'var(--gray-800)',
};
const presetBtn = (active) => ({
  fontSize: 12, fontWeight: 600, borderRadius: 6, padding: '5px 10px',
  border: active ? '1.5px solid var(--navy)' : '1.5px solid var(--gray-300)',
  background: active ? 'var(--navy)' : 'var(--white)',
  color: active ? 'var(--white)' : 'var(--gray-600)',
  cursor: 'pointer',
});
const textBtn = {
  fontSize: 12, fontWeight: 600, color: 'var(--navy-light)',
  background: 'var(--gray-100)', border: '1.5px solid var(--gray-200)',
  borderRadius: 5, padding: '3px 10px', cursor: 'pointer',
};
const blockerToggle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
};
const courseChip = (state) => {
  const styles = {
    required: { bg: '#DCFCE7', border: '#86EFAC', color: '#166534' },
    excluded: { bg: 'var(--gray-100)', border: 'var(--gray-300)', color: 'var(--gray-400)' },
    optional: { bg: '#EEF2FF', border: '#818CF8', color: 'var(--navy)' },
  }[state];
  return {
    display: 'flex', alignItems: 'center', flexWrap: 'nowrap',
    padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
    border: `1.5px solid ${styles.border}`,
    background: styles.bg, color: styles.color,
    transition: 'all 0.12s', whiteSpace: 'nowrap',
    textDecoration: state === 'excluded' ? 'line-through' : 'none',
    opacity: state === 'excluded' ? 0.7 : 1,
  };
};
const finalChip = {
  display: 'flex', alignItems: 'center',
  padding: '4px 10px', borderRadius: 7,
  border: '1.5px solid var(--navy)',
  background: 'var(--navy)', color: 'var(--gold-light)',
  whiteSpace: 'nowrap',
};
