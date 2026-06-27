import './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pushRoutes from './routes/push.js';
import { configureWebPush } from './cron/scheduler.js';

import { globalLimiter } from './middleware/rateLimit.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin only in non-production environments
    if (!origin && process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
}));

// Apply global rate limiting to all requests by default
app.use(globalLimiter);

app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'PinkCloud Push Server' });
});

app.use('/api/push', pushRoutes);

try {
  configureWebPush();
  console.log('Web Push VAPID configured');
} catch (err) {
  console.warn('Web Push not configured yet:', (err as Error).message);
  console.warn('Run: npm run generate-vapid --prefix server');
}

app.listen(PORT, () => {
  console.log(`PinkCloud Push Server running on http://localhost:${PORT}`);
});
