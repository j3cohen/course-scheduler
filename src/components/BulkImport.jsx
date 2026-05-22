import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';

export default function BulkImport({ existingCount, onImport, onCancel }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('add'); // 'add' | 'replace'
  const [error, setError] = useState('');

  function handleImport() {
    setError('');
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      setError('Could not parse JSON — make sure you copied the full block including the outer [ ].');
      return;
    }
    if (!Array.isArray(parsed)) {
      setError('Expected a JSON array starting with [ and ending with ].');
      return;
    }
    const courses = parsed.map(c => ({
      id: uuid(),
      code: String(c.code || ''),
      section: String(c.section || ''),
      name: String(c.name || 'Unnamed Course'),
      credits: Number(c.credits) || 0,
      isFinal: Boolean(c.isFinal),
      sections: (Array.isArray(c.sections) ? c.sections : []).map(s => ({
        id: uuid(),
        professor: String(s.professor || ''),
        days: Array.isArray(s.days) ? s.days : [],
        startTime: String(s.startTime || '09:00'),
        endTime: String(s.endTime || '10:00'),
      })),
    }));
    if (courses.length === 0) {
      setError('No courses found in the pasted text.');
      return;
    }
    onImport(courses, mode);
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontFamily: "'EB Garamond', serif", fontSize: 22, color: 'var(--navy)', fontWeight: 600 }}>
            Bulk Import
          </h2>
          <button onClick={onCancel} style={closeBtn}>✕</button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 14, lineHeight: 1.6 }}>
          Paste the JSON course list below. Each course needs at minimum a <code style={code}>name</code>, <code style={code}>credits</code>, and a <code style={code}>sections</code> entry with <code style={code}>startTime</code> / <code style={code}>endTime</code>.
        </div>

        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder={'[\n  {\n    "name": "Bankruptcy",\n    "credits": 2,\n    "sections": [{ "days": ["M"], "startTime": "09:00", "endTime": "11:00" }]\n  }\n]'}
          style={textarea}
          spellCheck={false}
        />

        {error && (
          <div style={{ fontSize: 13, color: 'var(--red)', background: 'var(--red-light)', borderRadius: 7, padding: '8px 12px', marginTop: 10 }}>
            {error}
          </div>
        )}

        {existingCount > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
            <label style={radioLabel}>
              <input type="radio" value="add" checked={mode === 'add'} onChange={() => setMode('add')} style={{ marginRight: 6 }} />
              Add to my {existingCount} existing course{existingCount !== 1 ? 's' : ''}
            </label>
            <label style={radioLabel}>
              <input type="radio" value="replace" checked={mode === 'replace'} onChange={() => setMode('replace')} style={{ marginRight: 6 }} />
              Replace all existing courses
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--gray-200)' }}>
          <button onClick={onCancel} style={cancelBtn}>Cancel</button>
          <button onClick={handleImport} disabled={!text.trim()} style={importBtn(!text.trim())}>
            Import courses
          </button>
        </div>
      </div>
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
  width: '100%', maxWidth: 580, padding: '24px 28px',
};
const closeBtn = {
  background: 'none', border: 'none', fontSize: 18, color: 'var(--gray-400)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
};
const textarea = {
  width: '100%', height: 220, fontFamily: 'monospace', fontSize: 12,
  border: '1.5px solid var(--gray-300)', borderRadius: 8, padding: '10px 12px',
  resize: 'vertical', color: 'var(--gray-800)', lineHeight: 1.5,
  outline: 'none',
};
const code = {
  fontFamily: 'monospace', fontSize: 12, background: 'var(--gray-100)',
  padding: '1px 5px', borderRadius: 4, color: 'var(--navy)',
};
const radioLabel = { display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--gray-700)', cursor: 'pointer' };
const cancelBtn = {
  padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1.5px solid var(--gray-200)', cursor: 'pointer',
};
const importBtn = (disabled) => ({
  padding: '9px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
  background: disabled ? 'var(--gray-200)' : 'var(--navy)',
  color: disabled ? 'var(--gray-400)' : 'var(--white)',
  border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '0 2px 6px rgba(4,30,66,0.25)',
});
