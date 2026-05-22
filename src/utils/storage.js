const COURSES_KEY = 'lawsched_courses';
const SAVED_KEY = 'lawsched_saved';

export function loadCourses() {
  try { return JSON.parse(localStorage.getItem(COURSES_KEY) || '[]'); }
  catch { return []; }
}

export function saveCourses(courses) {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
}

export function saveSaved(schedules) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(schedules));
}
