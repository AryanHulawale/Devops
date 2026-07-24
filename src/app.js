import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './config/logger.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import { securityMiddleware } from './middlewares/security.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

// Health check route — placed BEFORE security middleware so Docker
// healthchecks (wget) are not blocked by Arcjet bot detection.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use(securityMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Acquisitions API is running!' });
});

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions!');

  res.status(200).send('Hello from Acquisitions!');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
