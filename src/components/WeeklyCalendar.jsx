import React, { useState, useRef, useEffect } from 'react';
import { timeToMinutes, formatTime } from '../utils/scheduler.js';

const DAYS = ['M', 'T', 'W', 'Th', 'F'];
const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };
const START_HOUR = 8;
const END_HOUR = 21;

const COURSE_COLORS = [
  { bg: '#EEF2FF', border: '#818CF8', text: '#3730A3' },
  { bg: '#FFF7ED', border: '#FB923C', text: '#9A3412' },
  { bg: '#F0FDF4', border: '#4ADE80', text: '#166534' },
  { bg: '#FDF4FF', border: '#E879F9', text: '#7E22CE' },
  { bg: '#ECFEFF', border: '#22D3EE', text: '#155E75' },
  { bg: '#FFF1F2', border: '#FB7185', text: '#9F1239' },
  { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E' },
  { bg: '#F0F9FF', border: '#38BDF8', text: '#0C4A6E' },
];
const FINAL_COLOR = { bg: '#EFF6FF', border: '#041E42', text: '#041E42' };

export default function WeeklyCalendar({ blocks }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(560);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Responsive scaling
  const compact = containerWidth < 480;
  const LABEL_W = compact ? 26 : 44;
  const HOUR_H  = compact ? 42 : 54;
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_H;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const colorMap = {};
  let colorIdx = 0;
  blocks.forEach(b => {
    if (!(b.courseId in colorMap))
      colorMap[b.courseId] = b.isFinal ? FINAL_COLOR : COURSE_COLORS[colorIdx++ % COURSE_COLORS.length];
  });

  const selectedBlock = selectedKey
    ? blocks.find(b => `${b.courseId}_${b.sectionId}` === selectedKey)
    : null;

  function toggle(key) {
    setSelectedKey(prev => prev === key ? null : key);
  }

  return (
    <div ref={containerRef}>
      {/* Day headers */}
      <div style={{ display: 'flex', marginLeft: LABEL_W }}>
        {DAYS.map(d => (
          <div key={d} style={dayHeader(compact)}>
            {compact ? d : DAY_LABELS[d]}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex' }}>
        {/* Hour labels */}
        <div style={{ width: LABEL_W, flexShrink: 0, position: 'relative', height: totalHeight }}>
          {hours.map(h => (
            <div key={h} style={{
              position: 'absolute',
              top: (h - START_HOUR) * HOUR_H - 8,
              width: '100%', textAlign: 'right',
              paddingRight: compact ? 3 : 7,
              fontSize: compact ? 8 : 11,
              color: 'var(--gray-400)', fontWeight: 500, lineHeight: 1,
            }}>
              {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div style={{ flex: 1, display: 'flex' }}>
          {DAYS.map(day => {
            const dayBlocks = blocks.filter(b => b.days.includes(day));
            return (
              <div key={day} style={{ flex: 1, position: 'relative', height: totalHeight, borderLeft: '1px solid var(--gray-200)' }}>
                {hours.map(h => (
                  <React.Fragment key={h}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: (h - START_HOUR) * HOUR_H, borderTop: h === START_HOUR ? 'none' : '1px solid var(--gray-100)', height: 1 }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: (h - START_HOUR) * HOUR_H + HOUR_H / 2, borderTop: '1px dashed var(--gray-100)', height: 1 }} />
                  </React.Fragment>
                ))}
                {dayBlocks.map(b => {
                  const key = `${b.courseId}_${b.sectionId}`;
                  const isSelected = selectedKey === key;
                  const startMins = timeToMinutes(b.startTime) - START_HOUR * 60;
                  const endMins   = timeToMinutes(b.endTime)   - START_HOUR * 60;
                  const top    = (startMins / 60) * HOUR_H;
                  const height = Math.max(((endMins - startMins) / 60) * HOUR_H, 18);
                  const color  = colorMap[b.courseId];
                  const inset  = compact ? 1 : 3;
                  return (
                    <div
                      key={key}
                      onClick={() => toggle(key)}
                      title={b.label}
                      style={{
                        position: 'absolute', left: inset, right: inset, top, height,
                        background: color.bg,
                        border: `${isSelected ? 2.5 : 1.5}px solid ${color.border}`,
                        borderRadius: compact ? 4 : 7,
                        padding: compact ? '2px 3px' : '3px 5px',
                        overflow: 'hidden',
                        zIndex: isSelected ? 3 : 2,
                        cursor: 'pointer',
                        boxShadow: isSelected ? `0 0 0 2px ${color.border}44` : 'none',
                        transition: 'box-shadow 0.15s',
                      }}
                    >
                      {/* Always show code or short label */}
                      <div style={{ fontSize: compact ? 8 : 10, fontWeight: 700, color: color.text, lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {b.code || b.label}
                      </div>
                      {/* Show course name when there's room (non-compact only) */}
                      {!compact && height > 38 && (
                        <div style={{ fontSize: 9, color: color.text, opacity: 0.85, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 1 }}>
                          {b.label}
                        </div>
                      )}
                      {!compact && height > 60 && (
                        <div style={{ fontSize: 9, color: color.text, opacity: 0.65, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 1 }}>
                          {formatTime(b.startTime)}–{formatTime(b.endTime)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tap hint on compact */}
      {compact && blocks.length > 0 && !selectedBlock && (
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--gray-400)', marginTop: 8 }}>
          Tap a block for details
        </div>
      )}

      {/* Selected block detail card */}
      {selectedBlock && (
        <DetailCard
          block={selectedBlock}
          color={colorMap[selectedBlock.courseId]}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  );
}

function DetailCard({ block, color, onClose }) {
  return (
    <div style={{
      marginTop: 10,
      background: color.bg,
      border: `2px solid ${color.border}`,
      borderRadius: 10,
      padding: '10px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
      animation: 'fadeSlideIn 0.15s ease',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          {block.code && (
            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: color.text, opacity: 0.8 }}>
              {block.code}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: color.text, background: `${color.border}25`, borderRadius: 4, padding: '1px 6px' }}>
            {block.credits}cr
          </span>
          {block.isFinal && (
            <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--gold)', color: 'var(--navy)', borderRadius: 4, padding: '1px 6px' }}>
              FINAL
            </span>
          )}
        </div>
        <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 16, fontWeight: 500, color: color.text, lineHeight: 1.3, marginBottom: 5 }}>
          {block.label}
        </div>
        <div style={{ fontSize: 12, color: color.text, opacity: 0.75, display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
          {block.professor && <span>{block.professor}</span>}
          <span>{block.days.join(', ')} · {formatTime(block.startTime)}–{formatTime(block.endTime)}</span>
        </div>
      </div>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', fontSize: 15, color: color.text, opacity: 0.45, cursor: 'pointer', flexShrink: 0, padding: '0 2px', lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  );
}

const dayHeader = (compact) => ({
  flex: 1, textAlign: 'center',
  fontSize: compact ? 10 : 12, fontWeight: 700,
  color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em',
  padding: compact ? '6px 0' : '8px 0',
  borderBottom: '2px solid var(--gray-200)',
});
