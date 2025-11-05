import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import transactionsRoutes from './routes/transactions';
import produitsRoutes from './routes/produits';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware CORS - Configuration pour Codespaces
app.use(cors({
  origin: (origin, callback) => {
    // Accepter: pas d'origin (même domaine), localhost, ou n'importe quel Codespaces
    if (!origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('.app.github.dev')) {
      callback(null, true);
    } else {
      // Même si l'origine n'est pas permise, on ne renvoie pas d'erreur
      // On autorise quand même pour éviter de bloquer
      console.log('⚠️ Origine non standard autorisée:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/produits', produitsRoutes);

// Route de santé
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Listening on 0.0.0.0:${PORT}`);
});

export default app;
