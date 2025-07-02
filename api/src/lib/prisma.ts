import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Ensure the prisma instance is re-used during hot-reloading
  // in development to prevent too many connections.
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient({
      // Uncomment the line below to see Prisma logs in development
      // log: ['query', 'info', 'warn', 'error'],
    });
  }
  // @ts-ignore
  prisma = global.prisma;
}

export default prisma;
