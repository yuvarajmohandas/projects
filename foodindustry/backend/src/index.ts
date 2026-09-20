import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './lib/env';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { promoRouter } from './routes/promo';
import { ordersRouter } from './routes/orders';
import { addressesRouter } from './routes/addresses';
import { homepageRouter } from './routes/homepage';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api', productsRouter);
app.use('/api', promoRouter);
app.use('/api', ordersRouter);
app.use('/api', addressesRouter);
app.use('/api', homepageRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`FoodIndustry API listening on http://localhost:${env.port}`);
});
