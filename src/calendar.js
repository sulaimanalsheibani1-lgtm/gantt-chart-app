import { project } from './state.js';

const MINUTES_PER_HOUR = 60;

function minutesPerDay(settings) {
  return settings.hoursPerDay * MINUTES_PER_HOUR;
}

function toMinutes(amount, unit, settings) {
  switch (unit) {
    case 'h':
      return amount * MINUTES_PER_HOUR;
    case 'w':
      return amount * minutesPerDay(settings) * settings.workingDays.length;
    case 'd':
    default:
      return amount * minutesPerDay(settings);
  }
}

function minutesToUnit(mins, unit, settings) {
  switch (unit) {
    case 'h':
      return mins / MINUTES_PER_HOUR;
    case 'w':
      return mins / (minutesPerDay(settings) * settings.workingDays.length);
    case 'd':
    default:
      return mins / minutesPerDay(settings);
  }
}

export function isWorking(date, settings = project.settings) {
  const day = date.getDay();
  const iso = date.toISOString().slice(0, 10);
  return settings.workingDays.includes(day) && !settings.holidays.includes(iso);
}

export function nextWorking(date, settings = project.settings) {
  const d = new Date(date);
  while (!isWorking(d, settings)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function prevWorking(date, settings = project.settings) {
  const d = new Date(date);
  while (!isWorking(d, settings)) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

export function addWork(start, amount, unit = 'd', settings = project.settings) {
  let minutes = toMinutes(amount, unit, settings);
  const d = new Date(start);
  const step = minutes >= 0 ? 1 : -1;
  minutes = Math.abs(minutes);
  const minsPerDay = minutesPerDay(settings);

  while (minutes > 0) {
    d.setDate(d.getDate() + step);
    if (isWorking(d, settings)) {
      minutes -= minsPerDay;
    }
  }
  return d;
}

export function diffWork(start, end, unit = 'd', settings = project.settings) {
  const forward = end >= start;
  const step = forward ? 1 : -1;
  const minsPerDay = minutesPerDay(settings);
  let minutes = 0;
  const d = new Date(start);
  while ((forward && d < end) || (!forward && d > end)) {
    if (isWorking(d, settings)) minutes += minsPerDay;
    d.setDate(d.getDate() + step);
  }
  return minutesToUnit(forward ? minutes : -minutes, unit, settings);
}
