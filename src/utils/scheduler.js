const DAY_ORDER = { M: 0, T: 1, W: 2, Th: 3, F: 4 };

export function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(t) {
  const mins = timeToMinutes(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')}${ampm}`;
}

export function formatDays(days) {
  return days.slice().sort((a, b) => (DAY_ORDER[a] ?? 9) - (DAY_ORDER[b] ?? 9)).join(', ');
}

function sectionsConflict(s1, s2) {
  const sharedDays = s1.days.filter(d => s2.days.includes(d));
  if (sharedDays.length === 0) return false;
  const s1start = timeToMinutes(s1.startTime);
  const s1end = timeToMinutes(s1.endTime);
  const s2start = timeToMinutes(s2.startTime);
  const s2end = timeToMinutes(s2.endTime);
  return s1start < s2end && s2start < s1end;
}

function selectionConflicts(selections, newSection) {
  return selections.some(s => sectionsConflict(s.section, newSection));
}

// Check if a section overlaps any blocked 30-min cell (blocked cells don't apply to finals)
function sectionOverlapsBlocked(section, blockedCells) {
  if (!blockedCells || blockedCells.size === 0) return false;
  for (const day of section.days) {
    let t = timeToMinutes(section.startTime);
    const end = timeToMinutes(section.endTime);
    while (t < end) {
      const key = `${day}:${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
      if (blockedCells.has(key)) return true;
      t += 30;
    }
  }
  return false;
}

// options: { minCredits, maxCredits, blockedCells, requiredIds }
// requiredIds: Set of course IDs that must appear (soft-required, subject to blocked slots)
export function generateSchedules(courses, options = {}, limit = 500) {
  const {
    minCredits = 0,
    maxCredits = 17,
    blockedCells = new Set(),
    requiredIds = new Set(),
  } = options;

  // Hard finals: bank-level locks, bypass blocked-slot check
  const hardFinals = courses.filter(c => c.isFinal && c.sections.length > 0);
  // Soft required: must appear every schedule, but still checked against blocked slots
  const softRequired = courses.filter(c => !c.isFinal && requiredIds.has(c.id) && c.sections.length > 0);
  // Truly optional: may or may not appear
  const optionals = courses.filter(c => !c.isFinal && !requiredIds.has(c.id) && c.sections.length > 0);

  const hardCredits = hardFinals.reduce((s, c) => s + c.credits, 0);
  const softCredits = softRequired.reduce((s, c) => s + c.credits, 0);
  if (hardCredits + softCredits > maxCredits) {
    return { schedules: [], error: 'Final and required courses together exceed the maximum credit limit.' };
  }

  const results = [];
  const finalCombos = resolveSectionCombos(hardFinals);
  const baseSelections = finalCombos.length > 0 ? finalCombos : [[]];

  // Mandatory non-final courses come first in the array; backtrack uses mandatoryCount
  // to know which entries cannot be skipped.
  const nonFinalCourses = [...softRequired, ...optionals];
  const mandatoryCount = softRequired.length;

  for (const finalsSelection of baseSelections) {
    if (results.length >= limit) break;
    const finalsCredits = finalsSelection.reduce((s, x) => s + x.course.credits, 0);
    if (finalsCredits > maxCredits) continue;

    let bad = false;
    for (let i = 0; i < finalsSelection.length && !bad; i++)
      for (let j = i + 1; j < finalsSelection.length && !bad; j++)
        if (sectionsConflict(finalsSelection[i].section, finalsSelection[j].section)) bad = true;
    if (bad) continue;

    backtrack(nonFinalCourses, 0, mandatoryCount, finalsSelection, finalsCredits, minCredits, maxCredits, blockedCells, results, limit);
  }

  return { schedules: results, total: results.length };
}

function resolveSectionCombos(courses) {
  if (courses.length === 0) return [[]];
  const [first, ...rest] = courses;
  const restCombos = resolveSectionCombos(rest);
  const combos = [];
  for (const section of first.sections)
    for (const restCombo of restCombos)
      combos.push([{ course: first, section }, ...restCombo]);
  return combos;
}

// courses[0..mandatoryCount-1] must appear; courses[mandatoryCount..] are optional
function backtrack(courses, idx, mandatoryCount, current, currentCredits, minCredits, maxCredits, blockedCells, results, limit) {
  if (results.length >= limit) return;

  if (idx === courses.length) {
    if (currentCredits >= minCredits) results.push([...current]);
    return;
  }

  const course = courses[idx];
  const isMandatory = idx < mandatoryCount;

  if (!isMandatory) {
    // Optional: try skipping first
    backtrack(courses, idx + 1, mandatoryCount, current, currentCredits, minCredits, maxCredits, blockedCells, results, limit);
    if (results.length >= limit) return;
  }

  // Try including this course — try each section
  const newCredits = currentCredits + course.credits;
  if (newCredits <= maxCredits) {
    for (const section of course.sections) {
      if (!selectionConflicts(current, section) && !sectionOverlapsBlocked(section, blockedCells)) {
        current.push({ course, section });
        backtrack(courses, idx + 1, mandatoryCount, current, newCredits, minCredits, maxCredits, blockedCells, results, limit);
        current.pop();
        if (results.length >= limit) return;
      }
    }
  }
  // If mandatory and no valid section found, this branch silently produces no results
}

export function scheduleCredits(schedule) {
  const seen = new Set();
  return schedule.reduce((sum, { course }) => {
    if (seen.has(course.id)) return sum;
    seen.add(course.id);
    return sum + course.credits;
  }, 0);
}

export function calendarBlocks(schedule) {
  return schedule.map(({ course, section }) => ({
    courseId: course.id,
    sectionId: section.id,
    label: course.name,
    code: `${course.code}${course.section ? ' ' + course.section : ''}`,
    days: section.days,
    startTime: section.startTime,
    endTime: section.endTime,
    professor: section.professor,
    credits: course.credits,
    isFinal: course.isFinal,
  }));
}
