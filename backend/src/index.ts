import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import transactionsRoutes from './routes/transactions';
import produitsRoutes from './routes/produits';
import categoriesRoutes from './routes/categories';
import sessionsCaisseRoutes from './routes/sessionsCaisse';
import mouvementsStockRoutes from './routes/mouvementsStock';
import approvisionnementRoutes from './routes/approvisionnements';
import comptaRoutes from './routes/compta';
import comptesRoutes from './routes/comptes';
import logsRoutes from './routes/logs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware CORS - Mode développement: accepter toutes les origines
console.log('🔧 Configuration CORS: mode développement (toutes origines acceptées)');
app.use(cors({
  origin: true, // Accepter toutes les origines
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
app.use('/api/categories', categoriesRoutes);
app.use('/api/sessions-caisse', sessionsCaisseRoutes);
app.use('/api/mouvements-stock', mouvementsStockRoutes);
app.use('/api/approvisionnements', approvisionnementRoutes);
app.use('/api/compta', comptaRoutes);
app.use('/api/comptes', comptesRoutes);
app.use('/api/logs', logsRoutes);

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
