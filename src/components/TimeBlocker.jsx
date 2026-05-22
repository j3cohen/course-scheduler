import React, { useState, useEffect } from 'react';

const DAYS = ['M', 'T', 'W', 'Th', 'F'];
const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };
const START_HOUR = 8;
const END_HOUR = 21;
const CELL_H = 17;

const SLOTS = (() => {
  const s = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    s.push({ hour: h, min: 0 });
    s.push({ hour: h, min: 30 });
  }
  return s;
})();

function cellKey(day, hour, min) {
  return `${day}:${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function formatHourLabel(h) {
  if (h === 12) return '12p';
  if (h > 12) return `${h - 12}p`;
  return `${h}a`;
}

export default function TimeBlocker({ blocked, onChange }) {
  const [drag, setDrag] = useState(null); // { blocking: bool }

  useEffect(() => {
    const up = () => setDrag(null);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  function applyCell(day, hour, min, blocking) {
    const key = cellKey(day, hour, min);
    const next = new Set(blocked);
    if (blocking) next.add(key); else next.delete(key);
    onChange(next);
  }

  function handleMouseDown(day, hour, min, e) {
    e.preventDefault();
    const key = cellKey(day, hour, min);
    const blocking = !blocked.has(key);
    setDrag({ blocking });
    applyCell(day, hour, min, blocking);
  }

  function handleMouseEnter(day, hour, min) {
    if (!drag) return;
    const key = cellKey(day, hour, min);
    if (drag.blocking !== blocked.has(key)) applyCell(day, hour, min, drag.blocking);
  }

  const count = blocked.size;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
          Click or drag cells to block — optional courses won't land in blocked slots
          {count > 0 && <span style={{ fontWeight: 600, color: 'var(--red)', marginLeft: 6 }}>· {count} slot{count !== 1 ? 's' : ''} blocked</span>}
        </span>
        {count > 0 && (
          <button onClick={() => onChange(new Set())} style={clearBtn}>Clear all</button>
        )}
      </div>

      <div style={{ overflowX: 'auto', userSelect: 'none' }}>
        <div style={{ display: 'flex', minWidth: 340 }}>
          {/* Hour labels */}
          <div style={{ width: 34, flexShrink: 0, paddingTop: 22 }}>
            {SLOTS.map(({ hour, min }) => (
              <div key={`${hour}:${min}`} style={{
                height: CELL_H,
                textAlign: 'right',
                paddingRight: 5,
                fontSize: 10,
                color: min === 0 ? 'var(--gray-400)' : 'transparent',
                lineHeight: `${CELL_H}px`,
              }}>
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day, di) => (
            <div key={day} style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                height: 22, textAlign: 'center', fontSize: 11, fontWeight: 700,
                color: 'var(--gray-500)', lineHeight: '22px',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {DAY_LABELS[day]}
              </div>
              {SLOTS.map(({ hour, min }) => {
                const key = cellKey(day, hour, min);
                const isBlocked = blocked.has(key);
                return (
                  <div
                    key={key}
                    onMouseDown={e => handleMouseDown(day, hour, min, e)}
                    onMouseEnter={() => handleMouseEnter(day, hour, min)}
                    style={{
                      height: CELL_H,
                      background: isBlocked ? '#FECACA' : min === 0 ? '#F9FAFB' : '#FFFFFF',
                      borderTop: `1px solid ${min === 0 ? '#E5E7EB' : '#F3F4F6'}`,
                      borderLeft: di === 0 ? '1px solid #E5E7EB' : '1px solid #E5E7EB',
                      borderRight: di === 4 ? '1px solid #E5E7EB' : 'none',
                      cursor: 'crosshair',
                      transition: 'background 0.06s',
                    }}
                  />
                );
              })}
              {/* bottom border */}
              <div style={{ height: 1, background: '#E5E7EB' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const clearBtn = {
  fontSize: 11, fontWeight: 600, color: 'var(--red)',
  background: 'var(--red-light)', border: 'none', borderRadius: 5,
  padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
};
