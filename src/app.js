import express from 'express';
import cors from 'cors';
import schemeRoutes from './routes/schemeRoutes.js';
import benefitRoutes from './routes/benefitRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import taxonomyRoutes from './routes/taxonomyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { SAMPLE_SCHEMES } from './data/sampleInputs.js';

export function createApp() {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'government-scheme-extractor'
    });
  });

  // Sample dataset preview endpoint
  app.get('/api/samples', (req, res) => {
    res.status(200).json({
      success: true,
      count: SAMPLE_SCHEMES.length,
      data: SAMPLE_SCHEMES
    });
  });

  // Mount API Routes
  app.use('/api/schemes', schemeRoutes);
  app.use('/api/benefits', benefitRoutes);
  app.use('/api/eligibility', eligibilityRoutes);
  app.use('/api/review', reviewRoutes);
  app.use('/api/taxonomy', taxonomyRoutes);

  // 404 Route Not Found
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
