# Backend Setup Guide

This guide walks through setting up and running the backend from a fresh machine.

## 1. Prerequisites

Install the following before you begin:

- Git
- Node.js 22 or newer
- npm (bundled with Node.js)
- Docker Desktop, or another way to run PostgreSQL with PostGIS

If you want to run the database locally with the included Docker config, Docker Desktop is the simplest option.

## 2. Clone the repository

```bash
git clone https://github.com/Student-Algonquin-Mobile-Safety/Admin-dashboard.git
cd Admin-dashboard
```

If you already have the repository on your machine, open the `admin-dashboard` folder instead.

## 3. Install dependencies

Install the Node.js packages for the backend:

```bash
npm install
```

## 4. Create your environment file

Copy the example environment file and edit the values if needed:

```bash
cp .env.example .env
```

The default `.env.example` values are:

- `PORT=4000`
- `WS_PORT=4001`
- `DATABASE_URL=postgresql://postgres:password@127.0.0.1:5433/campus_safety?schema=public`
- `ADMIN_JWT_SECRET=replace-with-a-strong-random-secret`
- `ADMIN_JWT_EXPIRES_IN=8h`
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin123`

Update `ADMIN_JWT_SECRET` before using the backend in a real environment.

## 5. Start the database

This backend ships with a Docker Compose file for PostgreSQL + PostGIS.

Start only the database service:

```bash
docker compose up -d db
```

That starts Postgres on port `5433` on your machine and creates the `campus_safety` database.

If you are not using Docker, make sure your own PostgreSQL instance is running and update `DATABASE_URL` to match it.

## 6. Prepare Prisma

Generate the Prisma client after the dependencies and database are ready:

```bash
npx prisma generate
```

If this is a brand-new database, apply the migrations:

```bash
npx prisma migrate dev
```

This project also seeds a default campus on startup if the campus table is empty, so fresh installs are handled automatically.

## 7. Run the backend

Start the backend server and the websocket server together:

```bash
npm start
```

The backend will listen on `http://localhost:4000` by default.

If you want automatic restarts while developing, run:

```bash
npm run dev
```

## 8. Verify it is running

Once the backend starts, confirm the following:

- The API is reachable at `http://localhost:4000`
- The websocket server is running from the same startup command
- The database container is still running if you used Docker

You can also check the terminal output for the message:

```text
API listening on http://localhost:4000
```

## 9. Common startup issues

### Database connection errors

If the backend fails to connect to PostgreSQL, check that:

- Docker is running
- The database container is up
- `DATABASE_URL` points to the correct host, port, username, and password

### Prisma migration errors

If migrations fail, confirm that the database exists and that the `DATABASE_URL` value matches the running database.

### Port already in use

If port `4000` or `4001` is already taken, stop the conflicting process or change `PORT` and `WS_PORT` in `.env`.

## 10. Optional: stop the database

When you are done, stop the Docker database container with:

```bash
docker compose down
```
