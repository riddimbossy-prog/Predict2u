#!/usr/bin/env node
"use strict";

/**
 * API-Football / API-Sports plan window helper.
 *
 * Free plans reject dates outside a rolling 3-day window:
 *   "Free plans do not have access to this date, try from YYYY-MM-DD to YYYY-MM-DD."
 *
 * Paid plans never emit this error, so paid keys keep the full DAYS_BACK/DAYS_FWD
 * window. Free keys must skip out-of-window dates instead of retrying them to
 * death and publishing an empty board.
 */

const PLAN_WINDOW_RE = /free plans do not have access to this date[,\s]*try from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i;

function flattenErrors(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenErrors).filter(Boolean).join("; ");
  if (typeof value === "object") return Object.values(value).map(flattenErrors).filter(Boolean).join("; ");
  return String(value);
}

function parsePlanWindow(message) {
  const text = flattenErrors(message);
  const match = text.match(PLAN_WINDOW_RE);
  if (!match) return null;
  return { from: match[1], to: match[2], message: text };
}

function isPlanWindowError(message) {
  return PLAN_WINDOW_RE.test(flattenErrors(message));
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function dateInWindow(date, from, to) {
  if (!isIsoDate(date) || !isIsoDate(from) || !isIsoDate(to)) return false;
  return date >= from && date <= to;
}

function clampDates(dates, from, to) {
  if (!Array.isArray(dates)) return [];
  if (!isIsoDate(from) || !isIsoDate(to)) return dates.slice();
  return dates.filter(date => dateInWindow(date, from, to));
}

function utcTodayIso(now = new Date()) {
  const date = new Date(now);
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function orderDatesNearToday(dates, now = new Date()) {
  const today = utcTodayIso(now);
  const todayMs = Date.parse(`${today}T12:00:00Z`);
  return [...dates].sort((a, b) => {
    const da = Math.abs(Date.parse(`${a}T12:00:00Z`) - todayMs);
    const db = Math.abs(Date.parse(`${b}T12:00:00Z`) - todayMs);
    return da - db || String(a).localeCompare(String(b));
  });
}

module.exports = {
  flattenErrors,
  parsePlanWindow,
  isPlanWindowError,
  isIsoDate,
  dateInWindow,
  clampDates,
  utcTodayIso,
  orderDatesNearToday
};
