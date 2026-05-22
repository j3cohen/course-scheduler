import React, { useState } from 'react';
import CourseForm from './CourseForm.jsx';
import BulkImport from './BulkImport.jsx';
import { formatTime, formatDays } from '../utils/scheduler.js';

export default function CourseBank({ courses, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  function handleSave(course) {
    if (editing) {
      onUpdate(courses.map(c => c.id === course.id ? course : c));
    } else {
      onUpdate([...courses, course]);
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id) {
    onUpdate(courses.filter(c => c.id !== id));
  }

  function handleToggleFinal(id) {
    onUpdate(courses.map(c => c.id === id ? { ...c, isFinal: !c.isFinal } : c));
  }

  function openEdit(course) {
    setEditing(course);
    setShowForm(true);
  }

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function handleExport() {
    const data = courses.map(({ code, section, name, credits, isFinal, sections }) => ({
      code, section, name, credits, isFinal,
      sections: sections.map(({ professor, days, startTime, endTime }) => ({ professor, days, startTime, endTime })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-courses.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const finalCourses = courses.filter(c => c.isFinal);
  const optionalCourses = courses.filter(c => !c.isFinal);
  const totalFinalCredits = finalCourses.reduce((s, c) => s + c.credits, 0);

  return (
    <div>
      <div style={headerRow}>
        <div>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} in bank
            {finalCourses.length > 0 && (
              <span style={{ marginLeft: 10, color: 'var(--navy-light)', fontWeight: 600 }}>
                · {finalCourses.length} final ({totalFinalCredits}cr locked)
              </span>
            )}
          </p>
        </div>
        <button onClick={openAdd} style={addBtn}>
          + Add Course
        </button>
      </div>

      {courses.length === 0 && (
        <div style={emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 20, color: 'var(--navy)', marginBottom: 6 }}>No courses yet</div>
          <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>Add courses from your fall registration list to get started.</div>
        </div>
      )}

      {finalCourses.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <SectionLabel label="Final (Locked)" count={finalCourses.length} />
          <div style={courseList}>
            {finalCourses.map(c => (
              <CourseCard key={c.id} course={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id)} onToggleFinal={() => handleToggleFinal(c.id)} />
            ))}
          </div>
        </div>
      )}

      {optionalCourses.length > 0 && (
        <div>
          {finalCourses.length > 0 && <SectionLabel label="Optional" count={optionalCourses.length} />}
          <div style={courseList}>
            {optionalCourses.map(c => (
              <CourseCard key={c.id} course={c} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c.id)} onToggleFinal={() => handleToggleFinal(c.id)} />
            ))}
          </div>
        </div>
      )}

      <div style={utilFooter}>
        <button onClick={() => setShowBulkImport(true)} style={utilBtn}>Load classes</button>
        <button onClick={handleExport} disabled={courses.length === 0} style={{ ...utilBtn, opacity: courses.length === 0 ? 0.35 : 1, cursor: courses.length === 0 ? 'default' : 'pointer' }}>Save classes</button>
      </div>

      {showForm && (
        <CourseForm
          course={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {showBulkImport && (
        <BulkImport
          existingCount={courses.length}
          onImport={(imported, mode) => {
            onUpdate(mode === 'replace' ? imported : [...courses, ...imported]);
            setShowBulkImport(false);
          }}
          onCancel={() => setShowBulkImport(false)}
        />
      )}
    </div>
  );
}

function SectionLabel({ label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-500)' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, background: 'var(--gray-200)', color: 'var(--gray-600)', borderRadius: 99, padding: '1px 8px', fontWeight: 600 }}>
        {count}
      </span>
    </div>
  );
}

function CourseCard({ course, onEdit, onDelete, onToggleFinal }) {
  return (
    <div style={card(course.isFinal)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={codeTag(course.isFinal)}>
              {course.code}{course.section ? ` ${course.section}` : ''}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
              {course.credits}cr
            </span>
            {course.isFinal && (
              <span style={finalBadge}>FINAL</span>
            )}
          </div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, fontWeight: 500, color: 'var(--navy)', marginBottom: 6 }}>
            {course.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {course.sections.map((s, idx) => (
              <div key={s.id} style={{ fontSize: 13, color: 'var(--gray-600)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {course.sections.length > 1 && (
                  <span style={{ fontWeight: 600, color: 'var(--navy-light)', minWidth: 60 }}>Option {idx + 1}:</span>
                )}
                {s.professor && <span style={{ color: 'var(--gray-700)' }}>{s.professor}</span>}
                {s.professor && s.days.length > 0 && <span style={{ color: 'var(--gray-400)' }}>·</span>}
                {s.days.length > 0 && (
                  <span>{formatDays(s.days)} {formatTime(s.startTime)}–{formatTime(s.endTime)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button onClick={onToggleFinal} style={finalBtn(course.isFinal)} title={course.isFinal ? 'Unmark as final' : 'Mark as final'}>
            {course.isFinal ? '🔒 Final' : '📌 Set Final'}
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onEdit} style={editBtn}>Edit</button>
            <button onClick={onDelete} style={deleteBtn}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const headerRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 22,
};
const utilFooter = {
  display: 'flex', gap: 10, justifyContent: 'center',
  marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-200)',
};
const utilBtn = {
  fontSize: 12, color: 'var(--gray-400)', background: 'none',
  border: '1px solid var(--gray-200)', borderRadius: 6,
  padding: '5px 14px', cursor: 'pointer',
};
const addBtn = {
  background: 'var(--navy)', color: 'var(--white)', border: 'none',
  borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600,
  boxShadow: '0 2px 6px rgba(4,30,66,0.25)', cursor: 'pointer',
};
const emptyState = {
  textAlign: 'center', padding: '60px 24px', background: 'var(--white)',
  borderRadius: 'var(--radius-lg)', border: '2px dashed var(--gray-200)',
};
const courseList = { display: 'flex', flexDirection: 'column', gap: 10 };
const card = (isFinal) => ({
  background: 'var(--white)',
  border: isFinal ? '2px solid var(--navy)' : '1.5px solid var(--gray-200)',
  borderRadius: 'var(--radius)',
  padding: '14px 16px',
  boxShadow: isFinal ? '0 2px 8px rgba(4,30,66,0.10)' : 'var(--shadow-sm)',
  transition: 'box-shadow 0.15s',
});
const codeTag = (isFinal) => ({
  fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
  background: isFinal ? 'var(--navy)' : 'var(--gray-100)',
  color: isFinal ? 'var(--gold-light)' : 'var(--gray-600)',
  borderRadius: 5, padding: '2px 8px',
  letterSpacing: '0.04em',
});
const finalBadge = {
  fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
  background: 'var(--gold)', color: 'var(--navy)', borderRadius: 5,
  padding: '2px 7px',
};
const finalBtn = (isFinal) => ({
  fontSize: 12, fontWeight: 600, borderRadius: 7, padding: '5px 10px',
  border: isFinal ? '1.5px solid var(--navy)' : '1.5px solid var(--gray-300)',
  background: isFinal ? 'var(--navy)' : 'var(--white)',
  color: isFinal ? 'var(--gold-light)' : 'var(--gray-600)',
  whiteSpace: 'nowrap',
});
const editBtn = {
  fontSize: 12, borderRadius: 6, padding: '5px 12px',
  background: 'var(--gray-100)', color: 'var(--gray-700)',
  border: '1.5px solid var(--gray-200)',
};
const deleteBtn = {
  fontSize: 13, borderRadius: 6, padding: '5px 9px',
  background: 'var(--red-light)', color: 'var(--red)',
  border: '1.5px solid #fca5a5',
};
