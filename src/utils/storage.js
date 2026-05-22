import { v4 as uuid } from 'uuid';

const COURSES_KEY = 'lawsched_courses';
const SAVED_KEY = 'lawsched_saved';
const SEEDED_KEY = 'lawsched_seeded';

const SEED_COURSES = [
  { code: 'Law 054',  section: 'v07', name: 'Bankruptcy',                                       credits: 2, isFinal: false, sections: [{ professor: 'S. Flax',                          days: ['M'],       startTime: '09:00', endTime: '11:00' }] },
  { code: 'Law 156',  section: 'v06', name: 'Environmental Law Colloquium',                      credits: 3, isFinal: false, sections: [{ professor: 'Heinzerling',                       days: ['Th'],      startTime: '15:30', endTime: '17:30' }] },
  { code: 'Law 038',  section: 'v01', name: 'Antitrust Law',                                     credits: 3, isFinal: false, sections: [{ professor: 'Jonathan Pitt',                     days: ['M'],       startTime: '17:45', endTime: '20:50' }] },
  { code: 'Law 1631', section: 'v00', name: 'Federal Practice Seminar',                          credits: 3, isFinal: false, sections: [{ professor: 'Gornstein',                         days: ['M'],       startTime: '15:30', endTime: '17:30' }] },
  { code: 'Law 1974', section: 'v00', name: 'Business Torts',                                    credits: 3, isFinal: false, sections: [{ professor: 'Gregory Klass',                     days: ['T', 'Th'], startTime: '10:30', endTime: '11:55' }] },
  { code: 'Law 121',  section: 'v01', name: 'Corporations',                                      credits: 4, isFinal: false, sections: [{ professor: 'Langevoort',                        days: ['T', 'Th'], startTime: '13:20', endTime: '15:20' }] },
  { code: 'Law 220',  section: 'v02', name: 'Homelessness, Poverty and Legal Advocacy Seminar',  credits: 2, isFinal: false, sections: [{ professor: 'Patricia Fugere & Amber Harding',  days: ['Th'],      startTime: '11:10', endTime: '13:10' }] },
  { code: 'Law 195',  section: 'v05', name: 'Election: Voting, Campaigning and the Law',         credits: 3, isFinal: false, sections: [{ professor: 'Paul Smith',                        days: ['T', 'Th'], startTime: '09:35', endTime: '11:00' }] },
  { code: 'Law 304',  section: 'v06', name: 'Legislation',                                       credits: 3, isFinal: false, sections: [{ professor: 'A. Krishnakumar',                   days: ['T', 'Th'], startTime: '15:30', endTime: '16:55' }] },
];

function stampIds(courses) {
  return courses.map(c => ({
    ...c,
    id: uuid(),
    sections: c.sections.map(s => ({ ...s, id: uuid() })),
  }));
}

export function loadCourses() {
  if (!localStorage.getItem(SEEDED_KEY)) {
    localStorage.setItem(SEEDED_KEY, '1');
    const seeded = stampIds(SEED_COURSES);
    localStorage.setItem(COURSES_KEY, JSON.stringify(seeded));
    return seeded;
  }
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
