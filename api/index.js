const express = require('express');
const {
  readInvitees,
  writeInvitees,
  readRsvps,
  writeRsvps,
  readSettings,
  writeSettings,
  invitesToCsv,
  rsvpsToCsv,
  makeId,
  makeToken
} = require('../lib/store');

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password';
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || 'change-this-long-random-token';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

app.use(express.json({ limit: '2mb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

function adminOnly(req, res, next) {
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${ADMIN_API_TOKEN}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

function getRsvpForInvitee(inviteeId, rsvps) {
  return rsvps.find((item) => item.inviteeId === inviteeId) || {
    inviteeId,
    status: 'Pending',
    message: '',
    respondedAt: '',
    updatedAt: ''
  };
}

function publicInvite(invitee, settings, rsvp) {
  return {
    token: invitee.token,
    displayName: invitee.displayName,
    familyName: invitee.familyName,
    familyMembers: invitee.familyMembers || '',
    guestCount: invitee.guestCount,
    rsvpStatus: rsvp.status || 'Pending',
    rsvpMessage: rsvp.message || '',
    rsvpAt: rsvp.respondedAt || null,
    settings
  };
}

function adminInvite(invitee, rsvp) {
  return {
    ...invitee,
    rsvpStatus: rsvp.status || 'Pending',
    rsvpMessage: rsvp.message || '',
    rsvpAt: rsvp.respondedAt || null,
    inviteLink: `${PUBLIC_BASE_URL}/i/${invitee.token}`
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, storage: 'redis' }));

app.get('/api/invitations/:token', async (req, res) => {
  const invitees = await readInvitees();
  const invitee = invitees.find((item) => item.token === req.params.token);
  if (!invitee) return res.status(404).json({ message: 'Invitation not found' });

  const rsvp = getRsvpForInvitee(invitee.id, await readRsvps());
  res.json(publicInvite(invitee, await readSettings(), rsvp));
});

app.post('/api/invitations/:token/rsvp', async (req, res) => {
  const invitees = await readInvitees();
  const invitee = invitees.find((item) => item.token === req.params.token);
  if (!invitee) return res.status(404).json({ message: 'Invitation not found' });

  const { attending, message = '' } = req.body || {};
  if (typeof attending !== 'boolean') {
    return res.status(400).json({ message: 'Please select whether you will attend.' });
  }

  const rsvps = await readRsvps();
  const now = new Date().toISOString();
  let rsvp = rsvps.find((item) => item.inviteeId === invitee.id);
  if (!rsvp) {
    rsvp = { inviteeId: invitee.id, status: 'Pending', message: '', respondedAt: '', updatedAt: '' };
    rsvps.push(rsvp);
  }

  rsvp.status = attending ? 'Attending' : 'Declined';
  rsvp.message = String(message).slice(0, 500);
  rsvp.respondedAt = now;
  rsvp.updatedAt = now;
  await writeRsvps(rsvps);

  res.json({
    message: attending
      ? 'Thank you. We look forward to celebrating with you!'
      : 'Thank you for letting us know. You will be missed!',
    rsvpStatus: rsvp.status,
    guestCount: invitee.guestCount
  });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ message: 'Invalid admin password' });
  res.json({ token: ADMIN_API_TOKEN });
});

app.get('/api/admin/invitees', adminOnly, async (_req, res) => {
  const invitees = await readInvitees();
  const rsvps = await readRsvps();
  res.json(invitees.map((item) => adminInvite(item, getRsvpForInvitee(item.id, rsvps))));
});

app.post('/api/admin/invitees', adminOnly, async (req, res) => {
  const invitees = await readInvitees();
  const {
    displayName,
    familyName = '',
    familyMembers = '',
    guestCount,
    phone = '',
    email = '',
    notes = ''
  } = req.body || {};
  const count = Number(guestCount);

  if (!displayName || !Number.isInteger(count) || count < 1 || count > 20) {
    return res.status(400).json({ message: 'Display name and a guest count between 1 and 20 are required.' });
  }

  const now = new Date().toISOString();
  const invitee = {
    id: makeId(),
    token: makeToken(),
    displayName: String(displayName).trim(),
    familyName: String(familyName).trim(),
    familyMembers: String(familyMembers).trim(),
    guestCount: count,
    phone: String(phone).trim(),
    email: String(email).trim(),
    notes: String(notes).trim(),
    createdAt: now,
    updatedAt: now
  };

  invitees.unshift(invitee);
  await writeInvitees(invitees);

  const rsvps = await readRsvps();
  rsvps.unshift({ inviteeId: invitee.id, status: 'Pending', message: '', respondedAt: '', updatedAt: now });
  await writeRsvps(rsvps);

  res.status(201).json(adminInvite(invitee, getRsvpForInvitee(invitee.id, rsvps)));
});

app.put('/api/admin/invitees/:id', adminOnly, async (req, res) => {
  const invitees = await readInvitees();
  const invitee = invitees.find((item) => item.id === req.params.id);
  if (!invitee) return res.status(404).json({ message: 'Invitee not found' });

  const allowed = ['displayName', 'familyName', 'familyMembers', 'phone', 'email', 'notes'];
  allowed.forEach((key) => {
    if (req.body?.[key] !== undefined) invitee[key] = String(req.body[key]).trim();
  });

  if (req.body?.guestCount !== undefined) {
    const count = Number(req.body.guestCount);
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      return res.status(400).json({ message: 'Guest count must be between 1 and 20.' });
    }
    invitee.guestCount = count;
  }

  if (!invitee.displayName) {
    return res.status(400).json({ message: 'Invitee display name cannot be empty.' });
  }

  invitee.updatedAt = new Date().toISOString();
  await writeInvitees(invitees);

  const rsvp = getRsvpForInvitee(invitee.id, await readRsvps());
  res.json(adminInvite(invitee, rsvp));
});

app.delete('/api/admin/invitees/:id', adminOnly, async (req, res) => {
  const invitees = await readInvitees();
  const index = invitees.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Invitee not found' });

  invitees.splice(index, 1);
  await writeInvitees(invitees);
  await writeRsvps((await readRsvps()).filter((item) => item.inviteeId !== req.params.id));
  res.status(204).end();
});

app.post('/api/admin/invitees/:id/regenerate-link', adminOnly, async (req, res) => {
  const invitees = await readInvitees();
  const invitee = invitees.find((item) => item.id === req.params.id);
  if (!invitee) return res.status(404).json({ message: 'Invitee not found' });

  invitee.token = makeToken();
  invitee.updatedAt = new Date().toISOString();
  await writeInvitees(invitees);

  const rsvp = getRsvpForInvitee(invitee.id, await readRsvps());
  res.json(adminInvite(invitee, rsvp));
});

app.get('/api/admin/settings', adminOnly, async (_req, res) => {
  res.json(await readSettings());
});

app.put('/api/admin/settings', adminOnly, async (req, res) => {
  const current = await readSettings();
  const updated = { ...current, ...(req.body || {}) };
  await writeSettings(updated);
  res.json(updated);
});

app.get('/api/admin/stats', adminOnly, async (_req, res) => {
  const invitees = await readInvitees();
  const rsvps = await readRsvps();
  const totalInvitations = invitees.length;
  const totalSeats = invitees.reduce((sum, item) => sum + Number(item.guestCount || 0), 0);

  let attendingSeats = 0;
  let declinedSeats = 0;
  for (const invitee of invitees) {
    const status = getRsvpForInvitee(invitee.id, rsvps).status;
    if (status === 'Attending') attendingSeats += invitee.guestCount;
    if (status === 'Declined') declinedSeats += invitee.guestCount;
  }

  const pendingSeats = totalSeats - attendingSeats - declinedSeats;
  res.json({ totalInvitations, totalSeats, attendingSeats, declinedSeats, pendingSeats });
});

app.get('/api/admin/export/invitees.csv', adminOnly, async (_req, res) => {
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="invitees.csv"');
  res.send(invitesToCsv(await readInvitees()));
});

app.get('/api/admin/export/rsvps.csv', adminOnly, async (_req, res) => {
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="rsvps.csv"');
  res.send(rsvpsToCsv(await readRsvps()));
});

// Local-only convenience: `node api/index.js` still boots a plain server.
// On Vercel, this file is never executed directly — the exported `app`
// is invoked per-request as a serverless function instead.
if (require.main === module) {
  const PORT = Number(process.env.PORT || 4000);
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

module.exports = app;
