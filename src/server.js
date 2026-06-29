import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { campusesRouter } from './routes/campuses.js';
import { buildingsRouter } from './routes/buildings.js';
import { floorsRouter } from './routes/floors.js';
import { announcementsRouter } from './routes/announcements.js';
import { alertsRouter } from './routes/alerts.js';
import { eventsRouter } from './routes/events.js';
import { sosRouter } from './routes/sos.js';
import { reportsRouter } from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(logger);

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 router
const v1 = express.Router();

// Map & navigation 
v1.use('/campuses', campusesRouter);
v1.use('/buildings', buildingsRouter);
v1.use('/floors', floorsRouter);

Announcements, alerts, events
v1.use('/announcements', announcementsRouter);
v1.use('/alerts', alertsRouter);
v1.use('/events', eventsRouter);

//reports
v1.use('/reports', reportsRouter);


// SOS
v1.use('/sos', sosRouter);


app.use('/api/v1', v1);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});