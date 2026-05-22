import React, { useState, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { generateSchedules, scheduleCredits, calendarBlocks, formatTime, formatDays } from '../utils/scheduler.js';
import WeeklyCalendar from './WeeklyCalendar.jsx';
import FilterPanel from './FilterPanel.jsx';

const MAX_SCHEDULES = 500;

export default function ScheduleView({ courses, savedSchedules, onSaveSaved, onDeleteSaved }) {
  // Filter state
  const [minCredits, setMinCredits] = useState(12);
  const [maxCredits, setMaxCredits] = useState(17);
  const [requiredIds, setRequiredIds] = useState(new Set());
  const [excludedIds, setExcludedIds] = useState(new Set());
  const [blocked, setBlocked] = useState(new Set());
  const [committedBlocked, setCommittedBlocked] = useState(new Set());

  // Results & navigation
  const [generated, setGenerated] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // View state
  const [viewingSaved, setViewingSaved] = useState(null);
  const [view, setView] = useState('calendar');
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  function handleCreditChange(mn, mx) {
    setMinCredits(mn);
    setMaxCredits(mx);
  }

  function runGenerate(overrides = {}) {
    const opts = {
      minCr: minCredits, maxCr: maxCredits,
      reqIds: requiredIds, excIds: excludedIds, blk: blocked,
      ...overrides,
    };
    setIsGenerating(true);
    setViewingSaved(null);
    const filteredCourses = courses.filter(c => c.isFinal || !opts.excIds.has(c.id));
    setTimeout(() => {
      const result = generateSchedules(
        filteredCourses,
        { minCredits: opts.minCr, maxCredits: opts.maxCr, blockedCells: opts.blk, requiredIds: opts.reqIds },
        MAX_SCHEDULES
      );
      setGenerated(result);
      setCommittedBlocked(opts.blk);
      setCurrentIdx(0);
      setIsGenerating(false);
    }, 50);
  }

  function handleGenerate() { runGenerate(); }

  const currentSchedule = generated?.schedules?.[currentIdx] || null;
  const currentCredits = currentSchedule ? scheduleCredits(currentSchedule) : 0;

  const viewedSchedule = viewingSaved ? viewingSaved.schedule : currentSchedule;
  const viewedCredits = viewingSaved ? scheduleCredits(viewingSaved.schedule) : currentCredits;
  const viewedBlocks = viewedSchedule ? calendarBlocks(viewedSchedule) : null;

  function handleSave() {
    if (!currentSchedule) return;
    const name = saveName.trim() || `Schedule ${savedSchedules.length + 1}`;
    onSaveSaved([...savedSchedules, { id: uuid(), name, schedule: currentSchedule, credits: currentCredits, savedAt: Date.now() }]);
    setSaveName('');
    setShowSaveInput(false);
  }

  const isAlreadySaved = useMemo(() => {
    if (!currentSchedule) return false;
    const key = JSON.stringify(currentSchedule.map(x => x.section.id).sort());
    return savedSchedules.some(s => JSON.stringify(s.schedule.map(x => x.section.id).sort()) === key);
  }, [currentSchedule, savedSchedules]);

  const hasCourses = courses.some(c => c.sections.length > 0);

  return (
    <div>
      {/* Filter panel */}
      <FilterPanel
        courses={courses}
        minCredits={minCredits}
        maxCredits={maxCredits}
        onCreditChange={handleCreditChange}
        requiredIds={requiredIds}
        onRequiredChange={setRequiredIds}
        excludedIds={excludedIds}
        onExcludeChange={setExcludedIds}
        blocked={blocked}
        onBlockedChange={setBlocked}
      />

      {/* Generate bar */}
      <div style={generateBar}>
        <div style={{ flex: 1 }}>
          {generated && !generated.error && (
            generated.schedules.length === 0 ? (
              <span style={{ fontSize: 13, color: '#92400E' }}>
                No valid schedules found with current filters — try adjusting credits, courses, or blocked times.
              </span>
            ) : (
              <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 600 }}>
                ✓ {generated.schedules.length}{generated.schedules.length === MAX_SCHEDULES ? '+' : ''} valid schedule{generated.schedules.length !== 1 ? 's' : ''} found
                {generated.schedules.length === MAX_SCHEDULES && <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 400, marginLeft: 6 }}>(capped at {MAX_SCHEDULES})</span>}
              </span>
            )
          )}
          {generated?.error && <span style={{ fontSize: 13, color: 'var(--red)' }}>{generated.error}</span>}
          {!generated && !isGenerating && hasCourses && (
            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>Set filters above, then generate.</span>
          )}
          {!hasCourses && <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>Add courses to your Course Bank first.</span>}
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !hasCourses}
          style={generateBtn(isGenerating || !hasCourses)}
        >
          {isGenerating ? 'Generating…' : generated ? '↺ Regenerate' : 'Generate Schedules'}
        </button>
      </div>

      {/* Navigator */}
      {generated?.schedules?.length > 0 && !viewingSaved && (
        <div style={navigatorBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <NavBtn onClick={() => setCurrentIdx(0)} disabled={currentIdx === 0}>«</NavBtn>
            <NavBtn onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>‹</NavBtn>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', minWidth: 90, textAlign: 'center' }}>
              {currentIdx + 1} of {generated.schedules.length}
            </span>
            <NavBtn onClick={() => setCurrentIdx(i => Math.min(generated.schedules.length - 1, i + 1))} disabled={currentIdx === generated.schedules.length - 1}>›</NavBtn>
            <NavBtn onClick={() => setCurrentIdx(generated.schedules.length - 1)} disabled={currentIdx === generated.schedules.length - 1}>»</NavBtn>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={creditBadge(currentCredits, minCredits, maxCredits)}>{currentCredits} cr</span>
            {!isAlreadySaved ? (
              showSaveInput ? (
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <input
                    autoFocus
                    placeholder="Name this schedule…"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    style={{ border: '1.5px solid var(--gray-300)', borderRadius: 7, padding: '6px 10px', fontSize: 13, width: 170, fontFamily: 'inherit' }}
                  />
                  <button onClick={handleSave} style={saveConfirmBtn}>Save</button>
                  <button onClick={() => setShowSaveInput(false)} style={cancelSmBtn}>✕</button>
                </div>
              ) : (
                <button onClick={() => setShowSaveInput(true)} style={saveSchedBtn}>♡ Save</button>
              )
            ) : (
              <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✓ Saved</span>
            )}
          </div>
        </div>
      )}

      {/* Viewing saved schedule bar */}
      {viewingSaved && (
        <div style={navigatorBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setViewingSaved(null)} style={navBtnStyle}>← Back to results</button>
            <span style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 15 }}>{viewingSaved.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={creditBadge(viewingSaved.credits, minCredits, maxCredits)}>{viewingSaved.credits} cr</span>
            <button onClick={() => { onDeleteSaved(viewingSaved.id); setViewingSaved(null); }} style={cancelSmBtn}>Delete</button>
          </div>
        </div>
      )}

      {/* Content + view toggle */}
      {viewedSchedule && (
        <>
          <div style={calendarCard}>
            {view === 'calendar'
              ? <WeeklyCalendar blocks={viewedBlocks} blocked={committedBlocked} />
              : <CourseListView schedule={viewedSchedule} credits={viewedCredits} />
            }
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', gap: 0, background: 'var(--gray-100)', borderRadius: 8, padding: 3 }}>
                <button onClick={() => setView('calendar')} style={toggleBtn(view === 'calendar')}>Calendar</button>
                <button onClick={() => setView('list')} style={toggleBtn(view === 'list')}>Course List</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Saved schedules */}
      {savedSchedules.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)', marginBottom: 10 }}>
            Saved ({savedSchedules.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {savedSchedules.map(s => (
              <button
                key={s.id}
                onClick={() => setViewingSaved(viewingSaved?.id === s.id ? null : s)}
                style={savedChip(viewingSaved?.id === s.id)}
              >
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ opacity: 0.65, marginLeft: 6, fontSize: 12 }}>{s.credits}cr</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function NavBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...navBtnStyle, opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }}>
      {children}
    </button>
  );
}

function CourseListView({ schedule, credits }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 18, color: 'var(--navy)', fontWeight: 500 }}>Courses</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{credits} credits total</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {schedule.map(({ course, section }) => (
          <div key={`${course.id}_${section.id}`} style={listRow(course.isFinal)}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy-light)' }}>
                {course.code}{course.section ? ` ${course.section}` : ''}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', background: 'var(--gray-100)', borderRadius: 4, padding: '1px 6px' }}>
                {course.credits}cr
              </span>
              {course.isFinal && <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--gold)', color: 'var(--navy)', borderRadius: 4, padding: '1px 6px' }}>FINAL</span>}
              <span style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{course.name}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
              {section.professor && <span>{section.professor}</span>}
              {section.professor && section.days.length > 0 && <span style={{ margin: '0 5px', color: 'var(--gray-300)' }}>·</span>}
              {section.days.length > 0 && <span>{formatDays(section.days)} {formatTime(section.startTime)}–{formatTime(section.endTime)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const generateBar = {
  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
  background: 'var(--white)', borderRadius: 'var(--radius-lg)',
  padding: '14px 18px', marginBottom: 14,
  border: '1.5px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)',
};
const generateBtn = (disabled) => ({
  background: disabled ? 'var(--gray-200)' : 'var(--navy)',
  color: disabled ? 'var(--gray-400)' : 'var(--white)',
  border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  whiteSpace: 'nowrap',
  boxShadow: disabled ? 'none' : '0 2px 6px rgba(4,30,66,0.25)',
  flexShrink: 0,
});
const navigatorBar = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  flexWrap: 'wrap', gap: 10,
  background: 'var(--white)', borderRadius: 'var(--radius-lg)',
  padding: '12px 16px', marginBottom: 14, border: '1.5px solid var(--gray-200)',
  boxShadow: 'var(--shadow-sm)',
};
const navBtnStyle = {
  background: 'var(--gray-100)', color: 'var(--navy)', border: '1.5px solid var(--gray-200)',
  borderRadius: 7, padding: '5px 10px', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', minWidth: 32, textAlign: 'center',
};
const creditBadge = (credits, min, max) => {
  const low = credits < min;
  const high = credits > max;
  return {
    fontSize: 13, fontWeight: 700, borderRadius: 7, padding: '4px 12px',
    background: high ? 'var(--red-light)' : low ? 'var(--gray-100)' : credits >= 15 ? 'var(--gold-pale)' : 'var(--green-light)',
    color: high ? 'var(--red)' : low ? 'var(--gray-500)' : credits >= 15 ? '#92400E' : 'var(--green)',
  };
};
const saveSchedBtn = {
  background: 'var(--gold-pale)', color: '#92400E', border: '1.5px solid var(--gold)',
  borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const saveConfirmBtn = {
  background: 'var(--navy)', color: 'var(--white)', border: 'none',
  borderRadius: 7, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const cancelSmBtn = {
  background: 'var(--red-light)', color: 'var(--red)', border: 'none',
  borderRadius: 7, padding: '6px 10px', fontSize: 13, cursor: 'pointer',
};
const calendarCard = {
  background: 'var(--white)', borderRadius: 'var(--radius-lg)',
  padding: 'clamp(8px, 2vw, 16px) clamp(8px, 2vw, 18px)',
  border: '1.5px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', marginBottom: 14,
};
const toggleBtn = (active) => ({
  padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
  background: active ? 'var(--white)' : 'transparent',
  color: active ? 'var(--navy)' : 'var(--gray-500)',
  border: 'none', boxShadow: active ? 'var(--shadow-sm)' : 'none', cursor: 'pointer',
});
const savedChip = (active) => ({
  padding: '7px 14px', borderRadius: 8, fontSize: 13,
  background: active ? 'var(--navy)' : 'var(--white)',
  color: active ? 'var(--white)' : 'var(--gray-700)',
  border: active ? '1.5px solid var(--navy)' : '1.5px solid var(--gray-200)',
  boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
});
const listRow = (isFinal) => ({
  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
  border: isFinal ? '1.5px solid var(--navy)' : '1.5px solid var(--gray-200)',
  background: isFinal ? '#F0F4FF' : 'var(--gray-50)',
});
