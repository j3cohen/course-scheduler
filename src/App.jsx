import React, { useState, useEffect } from 'react';
import CourseBank from './components/CourseBank.jsx';
import ScheduleView from './components/ScheduleView.jsx';
import { loadCourses, saveCourses, loadSaved, saveSaved } from './utils/storage.js';

export default function App() {
  const [tab, setTab] = useState('bank');
  const [courses, setCourses] = useState(() => loadCourses());
  const [savedSchedules, setSavedSchedules] = useState(() => loadSaved());

  useEffect(() => { saveCourses(courses); }, [courses]);
  useEffect(() => { saveSaved(savedSchedules); }, [savedSchedules]);

  function handleDeleteSaved(id) {
    setSavedSchedules(prev => prev.filter(s => s.id !== id));
  }

  const finalCount = courses.filter(c => c.isFinal).length;
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={header}>
        <div style={headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={logoMark}>⚖</div>
            <div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 22, fontWeight: 600, color: 'var(--white)', lineHeight: 1.2 }}>
                Georgetown University Law Center
              </div>
              <div style={{ fontSize: 12, color: 'rgba(200,150,60,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                Not Built-in Schedule Planner
              </div>
            </div>
          </div>
          <div style={statsRow}>
            {courses.length > 0 && (
              <>
                <Stat label="Courses" value={courses.length} />
                <StatDiv />
                <Stat label="Bank Credits" value={totalCredits} />
                {finalCount > 0 && (
                  <>
                    <StatDiv />
                    <Stat label="Finals" value={finalCount} accent />
                  </>
                )}
                {savedSchedules.length > 0 && (
                  <>
                    <StatDiv />
                    <Stat label="Saved" value={savedSchedules.length} />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={tabBar}>
        <div style={tabBarInner}>
          <TabButton label="Course Bank" active={tab === 'bank'} count={courses.length} onClick={() => setTab('bank')} />
          <TabButton label="Schedules" active={tab === 'schedules'} count={savedSchedules.length || undefined} onClick={() => setTab('schedules')} />
        </div>
      </div>

      {/* Content */}
      <main style={main}>
        <div style={content}>
          {tab === 'bank' && (
            <CourseBank courses={courses} onUpdate={setCourses} />
          )}
          {tab === 'schedules' && (
            <ScheduleView
              courses={courses}
              savedSchedules={savedSchedules}
              onSaveSaved={setSavedSchedules}
              onDeleteSaved={handleDeleteSaved}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({ label, active, count, onClick }) {
  return (
    <button onClick={onClick} style={tabBtn(active)}>
      {label}
      {count !== undefined && count > 0 && (
        <span style={tabCount(active)}>{count}</span>
      )}
    </button>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent ? 'var(--gold-light)' : 'var(--white)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function StatDiv() {
  return <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)' }} />;
}

const header = {
  background: 'var(--navy)',
  boxShadow: '0 2px 12px rgba(4,30,66,0.4)',
  position: 'sticky', top: 0, zIndex: 100,
};
const headerInner = {
  maxWidth: 960, margin: '0 auto', padding: 'clamp(10px, 2vw, 14px) clamp(12px, 3vw, 24px)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
};
const logoMark = {
  width: 40, height: 40, borderRadius: 10,
  background: 'rgba(200,150,60,0.25)',
  border: '1.5px solid rgba(200,150,60,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 20, color: 'var(--gold-light)',
};
const statsRow = {
  display: 'flex', alignItems: 'center', gap: 16,
};
const tabBar = {
  background: 'var(--white)',
  borderBottom: '2px solid var(--gray-200)',
};
const tabBarInner = {
  maxWidth: 960, margin: '0 auto', padding: '0 24px',
  display: 'flex', gap: 0,
};
const tabBtn = (active) => ({
  padding: '13px 22px', fontSize: 14, fontWeight: 600,
  background: 'none', border: 'none',
  color: active ? 'var(--navy)' : 'var(--gray-500)',
  borderBottom: active ? '3px solid var(--navy)' : '3px solid transparent',
  marginBottom: -2,
  display: 'flex', alignItems: 'center', gap: 8,
  cursor: 'pointer',
  transition: 'color 0.15s',
});
const tabCount = (active) => ({
  fontSize: 11, fontWeight: 700, borderRadius: 99,
  padding: '1px 7px',
  background: active ? 'var(--navy)' : 'var(--gray-200)',
  color: active ? 'var(--white)' : 'var(--gray-500)',
});
const main = { flex: 1, padding: 'clamp(12px, 3vw, 24px) clamp(10px, 3vw, 20px)' };
const content = { maxWidth: 960, margin: '0 auto' };
