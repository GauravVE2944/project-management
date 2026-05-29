import 'dotenv/config'
import * as Prisma from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})

const PrismaClient = (Prisma as any).PrismaClient || (Prisma as any).default || (Prisma as any)

export const prisma = new PrismaClient({ adapter })