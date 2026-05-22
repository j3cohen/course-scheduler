import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';

const DAYS = ['M', 'T', 'W', 'Th', 'F'];

const emptySection = () => ({
  id: uuid(),
  professor: '',
  days: [],
  startTime: '09:00',
  endTime: '10:25',
});

export default function CourseForm({ course, onSave, onCancel }) {
  const [code, setCode] = useState('');
  const [section, setSection] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState(3);
  const [sections, setSections] = useState([emptySection()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (course) {
      setCode(course.code || '');
      setSection(course.section || '');
      setName(course.name || '');
      setCredits(course.credits || 3);
      setSections(course.sections?.length ? course.sections : [emptySection()]);
    }
  }, [course]);

  function updateSection(idx, field, value) {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function toggleDay(idx, day) {
    setSections(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const days = s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day];
      return { ...s, days };
    }));
  }

  function addSection() {
    setSections(prev => [...prev, emptySection()]);
  }

  function removeSection(idx) {
    setSections(prev => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Course name is required.';
    if (!credits || isNaN(credits) || Number(credits) <= 0) e.credits = 'Enter valid credits.';
    sections.forEach((s, i) => {
      if (!s.startTime || !s.endTime) e[`time_${i}`] = 'Start and end time are required.';
      else if (s.startTime >= s.endTime) e[`time_${i}`] = 'End time must be after start time.';
    });
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSave({
      id: course?.id || uuid(),
      code: code.trim(),
      section: section.trim(),
      name: name.trim(),
      credits: Number(credits),
      isFinal: course?.isFinal || false,
      sections,
    });
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: 'var(--navy)', fontWeight: 600 }}>
            {course ? 'Edit Course' : 'Add Course'}
          </h2>
          <button onClick={onCancel} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Course Name *" error={errors.name}>
            <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Business Torts" />
          </Field>
          <div style={row}>
            <Field label="Credits *" error={errors.credits} style={{ flex: '0 0 80px' }}>
              <input style={input} type="number" min="1" max="6" step="0.5" value={credits} onChange={e => setCredits(e.target.value)} />
            </Field>
            <Field label="Course Code" style={{ flex: '0 0 140px' }}>
              <input style={input} value={code} onChange={e => setCode(e.target.value)} placeholder="Law 1974 (optional)" />
            </Field>
            <Field label="Section" style={{ flex: '0 0 90px' }}>
              <input style={input} value={section} onChange={e => setSection(e.target.value)} placeholder="v00" />
            </Field>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={fieldLabel}>
                {sections.length > 1 ? 'Time / Section Options' : 'Meeting Time'}
              </label>
              <button type="button" onClick={addSection} style={addSectionBtn}>+ Add Option</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sections.map((s, idx) => (
                <div key={s.id} style={sectionBox}>
                  {sections.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Option {idx + 1}
                      </span>
                      <button type="button" onClick={() => removeSection(idx)} style={removeSectionBtn}>Remove</button>
                    </div>
                  )}
                  <Field label="Professor(s)" style={{ marginBottom: 10 }}>
                    <input style={input} value={s.professor} onChange={e => updateSection(idx, 'professor', e.target.value)} placeholder="optional" />
                  </Field>
                  <Field label="Days" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(idx, day)}
                          style={dayBtn(s.days.includes(day))}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div style={row}>
                    <Field label="Start Time *" error={errors[`time_${idx}`]} style={{ flex: 1 }}>
                      <input style={input} type="time" value={s.startTime} onChange={e => updateSection(idx, 'startTime', e.target.value)} />
                    </Field>
                    <Field label="End Time *" style={{ flex: 1 }}>
                      <input style={input} type="time" value={s.endTime} onChange={e => updateSection(idx, 'endTime', e.target.value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--gray-200)' }}>
            <button type="button" onClick={onCancel} style={cancelBtn}>Cancel</button>
            <button type="submit" style={saveBtn}>{course ? 'Save Changes' : 'Add Course'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label style={fieldLabel}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(4,30,66,0.55)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  backdropFilter: 'blur(3px)',
};
const modal = {
  background: 'var(--white)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
  width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '24px 28px',
};
const modalHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22,
};
const closeBtn = {
  background: 'none', border: 'none', fontSize: 18, color: 'var(--gray-400)',
  padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
};
const row = { display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' };
const fieldLabel = { fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const input = {
  border: '1.5px solid var(--gray-300)', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
  fontSize: 14, color: 'var(--gray-800)', width: '100%', outline: 'none',
  transition: 'border-color 0.15s',
  background: 'var(--white)',
};
const sectionBox = {
  background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)',
  borderRadius: 'var(--radius)', padding: '14px 16px',
};
const addSectionBtn = {
  fontSize: 12, fontWeight: 600, color: 'var(--navy-light)', background: 'var(--gray-100)',
  border: '1.5px solid var(--gray-200)', borderRadius: 6, padding: '5px 12px',
};
const removeSectionBtn = {
  fontSize: 12, color: 'var(--red)', background: 'var(--red-light)',
  border: 'none', borderRadius: 5, padding: '3px 10px',
};
const dayBtn = (active) => ({
  width: 38, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600,
  border: active ? '2px solid var(--navy)' : '1.5px solid var(--gray-300)',
  background: active ? 'var(--navy)' : 'var(--white)',
  color: active ? 'var(--white)' : 'var(--gray-600)',
});
const cancelBtn = {
  padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1.5px solid var(--gray-200)',
};
const saveBtn = {
  padding: '9px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
  background: 'var(--navy)', color: 'var(--white)', border: 'none',
  boxShadow: '0 2px 6px rgba(4,30,66,0.25)',
};
