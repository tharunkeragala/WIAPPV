# Sri Lankan React Wedding Invitation

A personalised mobile-first wedding invitation web app with a public invitation experience and an admin console.

## Main features

- Personalised invitation link for each invitee/family
- Mobile-first landing page with the couple photo as the full-screen background
- Couple name, invitee name, wedding date, venue and reserved seat count on the landing page
- Full wedding detail page
- Flip-style countdown clock
- Sri Lankan wedding programme / Poruwa ceremony section
- Photo gallery and lightbox
- Google Maps venue section
- RSVP accept/decline flow
- Reserved family/guest count is controlled only by admin and is read-only for invitees
- Admin login
- Add, edit and delete invitees
- Explicit **Save** button for each edited invitee row
- Generate/regenerate private invitation links
- Copy/share/open invitation links
- RSVP dashboard counts
- Wedding details configuration
- Download invitee CSV and joined RSVP details CSV from the admin page

## CSV storage

The project now keeps invitees and RSVP responses in **two separate CSV files**.

### Invitees

`server/data/invitees.csv`

Columns:

```text
id,token,displayName,familyName,familyMembers,guestCount,phone,email,notes,createdAt,updatedAt
```

This file contains invitation details only. RSVP responses are not stored here.

### RSVP responses

`server/data/rsvps.csv`

Columns:

```text
inviteeId,status,message,respondedAt,updatedAt
```

`inviteeId` connects the RSVP record to the invitee in `invitees.csv`.

### Wedding settings

Wedding-wide settings are kept separately in:

`server/data/settings.json`

This contains the couple names, date/time, venue, family details, programme and gallery configuration.

## How data changes work

The server reads the CSV files whenever invitation/admin data is requested. Therefore:

1. Admin creates or edits an invitee.
2. The server writes the change directly to `invitees.csv`.
3. A public invitation request reads the latest value from `invitees.csv`.
4. RSVP submissions write only to `rsvps.csv`.
5. The public invitation page reloads fresh data when it becomes active/focused again.

API responses are marked `no-store`, and the React API client also uses `cache: 'no-store'`, preventing old invitee details from being served from the browser cache.

## Important admin fix

The previous API helper replaced the request headers when an admin authorization header was supplied. This removed `Content-Type: application/json`, which could cause admin POST/PUT request bodies not to be parsed by Express.

The API helper now correctly merges:

- `Content-Type: application/json`
- `Authorization: Bearer ...`

Admin create/update/settings operations therefore reach the API correctly.

## Technology

- React 18 + Vite
- React Router
- Express.js API
- CSV file storage for invitees and RSVP responses
- JSON storage only for wedding-wide settings

## Quick start

1. Copy `.env.example` to `.env`.
2. Set a strong admin password and API token.
3. Install dependencies and run development mode:

```bash
npm run install:all
npm run dev
```

Open:

```text
Demo invitation:
http://localhost:5173/i/demo-perera-family

Admin:
http://localhost:5173/admin
```

The API runs on port `4000` and Vite runs on port `5173` during development.

## Admin workflow

### Add an invitee

Enter:

- Invitee display name
- Family/group name
- Family member names
- Reserved guest count
- Phone
- Email
- Admin notes

Click **Create Invitation**.

A unique private link is generated automatically.

### Edit an invitee

Edit the fields directly in the invitation table. The row will show **Unsaved changes**.

Click **Save** on that row. The update is then written to `server/data/invitees.csv`.

### RSVP

The invitee can only select:

- Joyfully Accept
- Regretfully Decline
- Optional message

The reserved count is displayed but cannot be changed.

The RSVP is written to `server/data/rsvps.csv`.

## Production build

```bash
npm run build
npm start
```

After building, Express serves the React application from `client/dist`.

For a local production test:

```env
PUBLIC_BASE_URL=http://localhost:4000
```

For production, set this to the hosted invitation address:

```env
PUBLIC_BASE_URL=https://invite.example.lk
```

If `PUBLIC_BASE_URL` is not set, admin links use the current request host. This means Vercel deployments automatically generate links with the hosted web address instead of localhost.

## Replace images

Wedding images are located in:

`client/public/images/`

The landing page currently uses:

```text
/images/gallery-1.jpg
```

Gallery image paths are configured in `server/data/settings.json`.

## Data backup

For a simple backup, copy these three files:

```text
server/data/invitees.csv
server/data/rsvps.csv
server/data/settings.json
```

Because invitees and RSVP responses are separated, you can replace/update the invitee list without mixing it with response data.

## Production security notes

For an internet-facing deployment, use:

- HTTPS only
- Reverse proxy such as Nginx/IIS
- Strong admin password and API token
- Rate limiting on login and RSVP endpoints
- Regular backups of both CSV files
- Server-side file permissions so CSV files cannot be downloaded directly from the public web root
