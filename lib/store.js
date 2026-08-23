const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

// Vercel injects these automatically once you add the "Upstash for Redis"
// integration from the Vercel Marketplace to this project.
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN
});

const INVITEES_KEY = 'wedding:invitees';
const RSVPS_KEY = 'wedding:rsvps';
const SETTINGS_KEY = 'wedding:settings';

const INVITEE_HEADERS = [
  'id',
  'token',
  'displayName',
  'familyName',
  'familyMembers',
  'guestCount',
  'phone',
  'email',
  'notes',
  'createdAt',
  'updatedAt'
];

const RSVP_HEADERS = [
  'inviteeId',
  'status',
  'message',
  'respondedAt',
  'updatedAt'
];

function makeId() {
  return crypto.randomUUID();
}

function makeToken() {
  return crypto.randomBytes(18).toString('base64url');
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers, rows) {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function readInvitees() {
  const invitees = (await redis.get(INVITEES_KEY)) || [];
  return invitees.map((item) => ({ ...item, guestCount: Number(item.guestCount) || 1 }));
}

async function writeInvitees(invitees) {
  await redis.set(INVITEES_KEY, invitees);
}

async function readRsvps() {
  const rsvps = (await redis.get(RSVPS_KEY)) || [];
  return rsvps.map((item) => ({ ...item, status: item.status || 'Pending' }));
}

async function writeRsvps(rsvps) {
  await redis.set(RSVPS_KEY, rsvps);
}

async function readSettings() {
  return (await redis.get(SETTINGS_KEY)) || {};
}

async function writeSettings(settings) {
  await redis.set(SETTINGS_KEY, settings);
}

function invitesToCsv(invitees) {
  return toCsv(INVITEE_HEADERS, invitees);
}

function rsvpsToCsv(rsvps) {
  return toCsv(RSVP_HEADERS, rsvps);
}

function rsvpDetailsToCsv(invitees, rsvps) {
  const headers = ['displayName', 'familyName', 'guestCount', ...RSVP_HEADERS];
  const rows = invitees.map((invitee) => ({
    displayName: invitee.displayName,
    familyName: invitee.familyName,
    guestCount: invitee.guestCount,
    ...rsvps.find((rsvp) => rsvp.inviteeId === invitee.id)
  }));
  return toCsv(headers, rows);
}

module.exports = {
  readInvitees,
  writeInvitees,
  readRsvps,
  writeRsvps,
  readSettings,
  writeSettings,
  invitesToCsv,
  rsvpsToCsv,
  rsvpDetailsToCsv,
  makeId,
  makeToken
};
