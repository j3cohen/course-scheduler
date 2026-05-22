import React, { useState, useRef, useEffect } from 'react';
import { timeToMinutes, formatTime } from '../utils/scheduler.js';

const DAYS = ['M', 'T', 'W', 'Th', 'F'];
const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };
const EARLIEST_HOUR = 8; // never display before this
const DEFAULT_START  = 9; // default when no early classes
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

function groupConsecutiveSlots(sortedMins) {
  const groups = [];
  for (const m of sortedMins) {
    if (groups.length > 0 && groups[groups.length - 1].end === m)
      groups[groups.length - 1].end = m + 30;
    else
      groups.push({ start: m, end: m + 30 });
  }
  return groups;
}

export default function WeeklyCalendar({ blocks, blocked }) {
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

  const compact = containerWidth < 480;
  const LABEL_W = compact ? 26 : 44;
  const HOUR_H  = compact ? 42 : 54;

  // Only show 8am row when a course actually starts before 9am
  const hasEarlyClass = blocks.some(b => timeToMinutes(b.startTime) < DEFAULT_START * 60);
  const START_HOUR = hasEarlyClass ? EARLIEST_HOUR : DEFAULT_START;

  const totalH = (END_HOUR - START_HOUR) * HOUR_H;
  const hours  = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const colorMap = {};
  let colorIdx = 0;
  blocks.forEach(b => {
    if (!(b.courseId in colorMap))
      colorMap[b.courseId] = b.isFinal ? FINAL_COLOR : COURSE_COLORS[colorIdx++ % COURSE_COLORS.length];
  });

  const blockedByDay = {};
  if (blocked && blocked.size > 0) {
    for (const day of DAYS) {
      const mins = [];
      for (const key of blocked) {
        const [d, hh, mm] = key.split(':');
        if (d !== day) continue;
        const m = parseInt(hh) * 60 + parseInt(mm);
        if (m >= START_HOUR * 60 && m < END_HOUR * 60) mins.push(m);
      }
      mins.sort((a, b) => a - b);
      blockedByDay[day] = groupConsecutiveSlots(mins);
    }
  }

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
            const dayBlocks  = blocks.filter(b => b.days.includes(day));
            const dayBlocked = blockedByDay[day] || [];

            return (
              <div key={day} style={{ flex: 1, position: 'relative', height: totalH, borderLeft: '1px solid var(--gray-200)' }}>
                {/* Grid lines */}
                {hours.map(h => (
                  <React.Fragment key={h}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: (h - START_HOUR) * HOUR_H, borderTop: h === START_HOUR ? 'none' : '1px solid var(--gray-100)', height: 1 }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: (h - START_HOUR) * HOUR_H + HOUR_H / 2, borderTop: '1px dashed var(--gray-100)', height: 1 }} />
                  </React.Fragment>
                ))}

                {/* Blocked time overlays */}
                {dayBlocked.map((g, i) => {
                  const top    = ((g.start - START_HOUR * 60) / 60) * HOUR_H;
                  const height = ((g.end - g.start) / 60) * HOUR_H;
                  return (
                    <div key={i} style={{
                      position: 'absolute', left: 0, right: 0, top, height,
                      background: 'repeating-linear-gradient(135deg, rgba(220,38,38,0.07) 0px, rgba(220,38,38,0.07) 4px, transparent 4px, transparent 10px)',
                      borderLeft: '2.5px solid rgba(220,38,38,0.3)',
                      zIndex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {height >= 18 && (
                        <span style={{
                          fontSize: compact ? 6 : 8, fontWeight: 800,
                          color: 'rgba(220,38,38,0.4)',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          writingMode: height < 28 ? 'horizontal-tb' : 'vertical-rl',
                          transform: height >= 28 ? 'rotate(180deg)' : 'none',
                        }}>
                          blocked
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Course blocks */}
                {dayBlocks.map(b => {
                  const blockKey   = `${b.courseId}_${b.sectionId}`;
                  const isExpanded = selectedKey === blockKey;
                  const startMins  = timeToMinutes(b.startTime) - START_HOUR * 60;
                  const endMins    = timeToMinutes(b.endTime)   - START_HOUR * 60;
                  const top        = (startMins / 60) * HOUR_H;
                  const natH       = Math.max(((endMins - startMins) / 60) * HOUR_H, 18);
                  const color      = colorMap[b.courseId];
                  const inset      = compact ? 1 : 3;
                  const hasCode    = Boolean(b.code);
                  const fs         = compact ? 8  : 10;
                  const fsSub      = compact ? 7  : 9;

                  // maxHeight controls clipping: natH when collapsed, large value when expanded.
                  // height:'auto' + minHeight:natH ensures the box is always at least natH tall
                  // and grows with content when maxHeight is released.
                  // overflow:'hidden' is safe here — height:auto sizes the box to content exactly,
                  // so nothing is ever clipped when expanded.
                  return (
                    <div
                      key={`${day}_${blockKey}`}
                      onClick={() => toggle(blockKey)}
                      style={{
                        position: 'absolute',
                        left: inset, right: inset, top,
                        height: 'auto',
                        minHeight: natH,
                        maxHeight: isExpanded ? 600 : natH,
                        background: color.bg,
                        border: `${isExpanded ? 2 : 1.5}px solid ${color.border}`,
                        borderRadius: compact ? 4 : 7,
                        padding: compact ? '2px 3px' : '3px 5px',
                        overflow: 'hidden',
                        zIndex: isExpanded ? 10 : 2,
                        cursor: 'pointer',
                        boxShadow: isExpanded ? `0 3px 14px ${color.border}66` : 'none',
                        transition: 'box-shadow 0.15s, max-height 0.2s ease',
                      }}
                    >
                      {/* Line 1: code (or label when no code) */}
                      <div style={{ fontSize: fs, fontWeight: 700, color: color.text, lineHeight: 1.3, whiteSpace: isExpanded ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.code || b.label}
                      </div>

                      {/* Line 2: full course name (when code is separate) */}
                      {hasCode && (
                        <div style={{ fontSize: fsSub, color: color.text, opacity: 0.9, lineHeight: 1.3, marginTop: 1, whiteSpace: isExpanded ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.label}
                        </div>
                      )}

                      {/* Line 3: professor */}
                      {b.professor && (
                        <div style={{ fontSize: fsSub, color: color.text, opacity: 0.75, lineHeight: 1.3, marginTop: 1, whiteSpace: isExpanded ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.professor}
                        </div>
                      )}

                      {/* Line 4: time */}
                      <div style={{ fontSize: fsSub, color: color.text, opacity: 0.65, lineHeight: 1.3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatTime(b.startTime)}–{formatTime(b.endTime)}
                      </div>

                      {/* Expand / collapse indicator */}
                      {isExpanded
                        ? <div style={{ fontSize: fsSub - 1, color: color.text, opacity: 0.4, marginTop: 4, textAlign: 'right' }}>▴ less</div>
                        : <div style={{ position: 'absolute', bottom: 1, right: 3, fontSize: fsSub - 1, color: color.text, opacity: 0.35, lineHeight: 1 }}>▾</div>
                      }
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
