import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: ["error"]
  });

// In Next.js dev, reuse the client across hot reloads.
if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

