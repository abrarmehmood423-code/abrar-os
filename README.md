# Abrar OS

A private, offline-first personal life operating system.

## Included

- Today command centre
- Tasks and recurring responsibilities
- Medicine schedule and taken-time log
- Diet, calories, protein, weight, waist and HbA1c tracking
- Income, expenses, bills, subscriptions and direct debits
- Loans, disputed amounts and manual debt payments
- Family events
- Documents and expiry reminders
- Follow-up / waiting-for tracker
- Workspaces for AAA Work, Embrace and Level 7
- Vehicle records for Prius and Corsa
- Brain dump
- JSON backup/import
- Installable Progressive Web App
- Offline support

## Cost

The app has no paid dependency. It can be hosted free on GitHub Pages, Cloudflare Pages, Netlify or Vercel.

## Important data note

This version stores data in the current browser using `localStorage`. It does not send your data to a server. Export backups regularly from:

`Life → Settings → Export backup`

A browser reset or cleared site data can remove local records.

## Run on your computer

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy

Import this repository into Vercel. No build command or framework preset is required because this is a static PWA.

## Notifications

Browser notifications require HTTPS and permission. Critical transplant medicines should also remain in the phone's native alarms.
