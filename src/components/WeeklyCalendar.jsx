import React from 'react';
import { timeToMinutes, formatTime } from '../utils/scheduler.js';

const DAYS = ['M', 'T', 'W', 'Th', 'F'];
const DAY_LABELS = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };
const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_MINS = (END_HOUR - START_HOUR) * 60;
const HOUR_HEIGHT = 54;
const LABEL_WIDTH = 46;

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
  const colorMap = {};
  let colorIdx = 0;
  blocks.forEach(b => {
    if (!(b.courseId in colorMap)) {
      colorMap[b.courseId] = b.isFinal ? FINAL_COLOR : COURSE_COLORS[colorIdx++ % COURSE_COLORS.length];
    }
  });

  const totalHeight = TOTAL_MINS / 60 * HOUR_HEIGHT;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', marginTop: 4 }}>
      <div style={{ minWidth: 560 }}>
        {/* Day headers */}
        <div style={{ display: 'flex', marginLeft: LABEL_WIDTH, marginBottom: 0 }}>
          {DAYS.map(d => (
            <div key={d} style={dayHeader}>{DAY_LABELS[d]}</div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', position: 'relative' }}>
          {/* Hour labels */}
          <div style={{ width: LABEL_WIDTH, flexShrink: 0, position: 'relative', height: totalHeight }}>
            {hours.map(h => (
              <div key={h} style={{ position: 'absolute', top: (h - START_HOUR) * HOUR_HEIGHT - 8, width: '100%', textAlign: 'right', paddingRight: 8, fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>
                {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div style={{ flex: 1, display: 'flex', gap: 0 }}>
            {DAYS.map(day => {
              const dayBlocks = blocks.filter(b => b.days.includes(day));
              return (
                <div key={day} style={{ flex: 1, position: 'relative', height: totalHeight, borderLeft: '1px solid var(--gray-200)' }}>
                  {/* Hour lines */}
                  {hours.map(h => (
                    <div key={h} style={{
                      position: 'absolute', left: 0, right: 0,
                      top: (h - START_HOUR) * HOUR_HEIGHT,
                      borderTop: h === START_HOUR ? 'none' : '1px solid var(--gray-100)',
                      height: 1,
                    }} />
                  ))}
                  {/* Half-hour lines */}
                  {hours.map(h => (
                    <div key={`h_${h}`} style={{
                      position: 'absolute', left: 0, right: 0,
                      top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                      borderTop: '1px dashed var(--gray-100)',
                      height: 1,
                    }} />
                  ))}
                  {/* Course blocks */}
                  {dayBlocks.map(b => {
                    const startMins = timeToMinutes(b.startTime) - START_HOUR * 60;
                    const endMins = timeToMinutes(b.endTime) - START_HOUR * 60;
                    const top = (startMins / 60) * HOUR_HEIGHT;
                    const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 20);
                    const color = colorMap[b.courseId];
                    return (
                      <div key={`${b.courseId}_${b.sectionId}`} style={{
                        position: 'absolute', left: 3, right: 3,
                        top, height,
                        background: color.bg,
                        border: `2px solid ${color.border}`,
                        borderRadius: 7,
                        padding: '3px 5px',
                        overflow: 'hidden',
                        zIndex: 2,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 1.3, marginBottom: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: color.text }}>{b.code}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: color.text, opacity: 0.7 }}>{b.credits}cr</span>
                        </div>
                        {height > 38 && (
                          <div style={{ fontSize: 10, color: color.text, opacity: 0.8, lineHeight: 1.2, overflow: 'hidden' }}>
                            {b.label}
                          </div>
                        )}
                        {height > 58 && b.professor && (
                          <div style={{ fontSize: 10, color: color.text, opacity: 0.65, marginTop: 2 }}>
                            {b.professor}
                          </div>
                        )}
                        {height > 72 && (
                          <div style={{ fontSize: 10, color: color.text, opacity: 0.65 }}>
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
      </div>
    </div>
  );
}

const dayHeader = {
  flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700,
  color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em',
  padding: '8px 0', borderBottom: '2px solid var(--gray-200)',
};
