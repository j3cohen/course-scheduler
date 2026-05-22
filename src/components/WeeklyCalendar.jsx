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

// Approximate height (px) needed to fit N lines of text + padding
function linesHeight(n, compact) {
  const lineH = compact ? 10 : 12;
  const pad   = compact ? 4  : 6;
  return n * lineH + pad;
}

export default function WeeklyCalendar({ blocks }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(560);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const ro = new ResizeObserver(([e]) => setContainerWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compact  = containerWidth < 480;
  const LABEL_W  = compact ? 26 : 44;
  const HOUR_H   = compact ? 42 : 54;
  const totalH   = (END_HOUR - START_HOUR) * HOUR_H;
  const hours    = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const colorMap = {};
  let colorIdx = 0;
  blocks.forEach(b => {
    if (!(b.courseId in colorMap))
      colorMap[b.courseId] = b.isFinal ? FINAL_COLOR : COURSE_COLORS[colorIdx++ % COURSE_COLORS.length];
  });

  function toggle(key) {
    setSelectedKey(prev => prev === key ? null : key);
  }

  return (
    <div ref={containerRef}>
      {/* Day headers */}
      <div style={{ display: 'flex', marginLeft: LABEL_W }}>
        {DAYS.map(d => (
          <div key={d} style={dayHeader(compact)}>{compact ? d : DAY_LABELS[d]}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex' }}>
        {/* Hour labels */}
        <div style={{ width: LABEL_W, flexShrink: 0, position: 'relative', height: totalH }}>
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
              <div key={day} style={{ flex: 1, position: 'relative', height: totalH, borderLeft: '1px solid var(--gray-200)' }}>
                {/* Grid lines */}
                {hours.map(h => (
                  <React.Fragment key={h}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: (h - START_HOUR) * HOUR_H, borderTop: h === START_HOUR ? 'none' : '1px solid var(--gray-100)', height: 1 }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: (h - START_HOUR) * HOUR_H + HOUR_H / 2, borderTop: '1px dashed var(--gray-100)', height: 1 }} />
                  </React.Fragment>
                ))}

                {/* Course blocks */}
                {dayBlocks.map(b => {
                  const key        = `${b.courseId}_${b.sectionId}`;
                  const isExpanded = selectedKey === key;
                  const startMins  = timeToMinutes(b.startTime) - START_HOUR * 60;
                  const endMins    = timeToMinutes(b.endTime)   - START_HOUR * 60;
                  const top        = (startMins / 60) * HOUR_H;
                  const natH       = Math.max(((endMins - startMins) / 60) * HOUR_H, 18);
                  const color      = colorMap[b.courseId];
                  const inset      = compact ? 1 : 3;
                  const hasCode    = Boolean(b.code);

                  // Which lines fit in natural height (1=code/label, 2=name, 3=prof, 4=time)
                  const showName = natH >= linesHeight(2, compact) && hasCode;
                  const showProf = natH >= linesHeight(hasCode ? 3 : 2, compact) && Boolean(b.professor);
                  const showTime = natH >= linesHeight((hasCode ? 1 : 0) + (showName ? 1 : 0) + (showProf ? 1 : 0) + 1, compact);
                  const hasHidden = (hasCode && !showName) || (b.professor && !showProf) || !showTime;

                  const fontSize     = compact ? 8  : 10;
                  const fontSizeSm   = compact ? 7  : 9;
                  const lineStyle    = { fontSize, fontWeight: 700, color: color.text, lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' };
                  const subLineStyle = { fontSize: fontSizeSm, color: color.text, opacity: 0.8, lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginTop: 1 };

                  return (
                    <div
                      key={key}
                      onClick={() => (hasHidden || isExpanded) && toggle(key)}
                      style={{
                        position: 'absolute',
                        left: inset, right: inset, top,
                        height: isExpanded ? 'auto' : natH,
                        minHeight: isExpanded ? natH : undefined,
                        background: color.bg,
                        border: `${isExpanded ? 2 : 1.5}px solid ${color.border}`,
                        borderRadius: compact ? 4 : 7,
                        padding: compact ? '2px 3px' : '3px 5px',
                        overflow: isExpanded ? 'visible' : 'hidden',
                        zIndex: isExpanded ? 10 : 2,
                        cursor: (hasHidden || isExpanded) ? 'pointer' : 'default',
                        boxShadow: isExpanded ? `0 3px 14px ${color.border}55` : 'none',
                        transition: 'box-shadow 0.15s',
                      }}
                    >
                      {/* Line 1: code or full label when no code */}
                      <div style={lineStyle}>
                        {b.code || b.label}
                        {!hasCode && b.credits && (
                          <span style={{ fontWeight: 600, opacity: 0.65, marginLeft: 3 }}>{b.credits}cr</span>
                        )}
                      </div>

                      {/* Line 2: full name (when there's a code) */}
                      {(showName || isExpanded) && hasCode && (
                        <div style={subLineStyle}>{b.label}</div>
                      )}

                      {/* Line 3: professor */}
                      {(showProf || isExpanded) && b.professor && (
                        <div style={subLineStyle}>{b.professor}</div>
                      )}

                      {/* Line 4: time */}
                      {(showTime || isExpanded) && (
                        <div style={subLineStyle}>{formatTime(b.startTime)}–{formatTime(b.endTime)}</div>
                      )}

                      {/* Credits + expand/collapse indicator */}
                      {isExpanded ? (
                        <div style={{ fontSize: fontSizeSm, color: color.text, opacity: 0.5, marginTop: 2, textAlign: 'right' }}>▴ less</div>
                      ) : hasHidden ? (
                        <div style={{ position: 'absolute', bottom: 1, right: 3, fontSize: fontSizeSm, color: color.text, opacity: 0.45, lineHeight: 1 }}>▾</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const dayHeader = (compact) => ({
  flex: 1, textAlign: 'center',
  fontSize: compact ? 10 : 12, fontWeight: 700,
  color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em',
  padding: compact ? '5px 0' : '8px 0',
  borderBottom: '2px solid var(--gray-200)',
});
