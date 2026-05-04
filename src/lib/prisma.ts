/**
 * PRISMA STUB - Edge Runtime Compatible
 *
 * Prisma Client is NOT compatible with Cloudflare Edge Runtime.
 * All database operations now go through the Supabase client (src/lib/db.ts).
 * This file exists as a compatibility shim for any legacy code.
 *
 * @prisma/client has been moved to devDependencies and will NOT
 * be bundled in Cloudflare Pages production builds.
 */

// Re-export the Supabase client under the `prisma` name
// so any remaining `import { prisma }` calls continue to work.
export { db as prisma } from '@/lib/db';
export type PrismaInstance = any;
