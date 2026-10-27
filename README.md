# Algonquin GO — Backend API

REST and WebSocket backend for **Algonquin GO**, a campus safety and indoor navigation platform built for Algonquin College. It powers the [mobile app](https://github.com/loudiyaymen/Mobile-app) used by students and staff and the [admin dashboard](https://github.com/loudiyaymen/Admin-dashboard-frontend) used by campus security.

Placed 2nd out of 100+ participants in an Algonquin College project competition.

## What it does

- **Emergency alerts and SOS:** receives SOS triggers from the app, broadcasts campus or building-wide alerts over WebSockets and push notifications, and tracks when each alert is resolved.
- **Incident reports:** accepts incident, assault and lost-item reports with photo uploads, validated and sanitized before they are stored.
- **Indoor navigation data:** stores versioned navigation graphs per building that the mobile app uses for multi-floor routing.
- **Campus events:** event management with registrations, capacity limits, duplicate-registration checks and random winner draws.
- **Analytics:** report and usage metrics for the admin dashboard.
- **Admin auth:** JWT-based admin login with token revocation, Helmet and XSS input sanitization.

## Tech stack

Node.js · Express 5 · Prisma 7 · PostgreSQL + PostGIS · `ws` · JWT · Multer · Docker · Azure App Service and Blob Storage · `node:test` + Supertest

## Project structure

```
prisma/        Schema and migrations
src/routes/    One router per resource (alerts, reports, events, navigation, ...)
src/controllers/
src/middleware/  Auth, input sanitization, request validation, logging
src/bootstrap/   Seeds a default campus and navigation graphs on startup
src/websocket.js Real-time alert broadcasting
test/          Route tests with Prisma and WebSocket mocks
postman/       Postman collection for the API
```

## Getting started

```bash
git clone https://github.com/loudiyaymen/Admin-dashboard.git
cd Admin-dashboard
npm install
cp .env.example .env
docker compose up -d db
npm run dev
```

The API listens on `http://localhost:4000` and the WebSocket server on port `4001`. See [BACKEND_SETUP.md](BACKEND_SETUP.md) for the full setup guide and troubleshooting.

Run the tests with:

```bash
npm test
```

## Credits

UI/UX design by the Algonquin College design team (Figma).
