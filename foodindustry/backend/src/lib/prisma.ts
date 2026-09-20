import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient instance (important with tsx watch / hot reload
// so we don't exhaust SQLite connections).
export const prisma = new PrismaClient();
