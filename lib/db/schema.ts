import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified').notNull().default(0),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(), token: text('token').notNull().unique(), userId: text('userId').notNull(), expiresAt: timestamp('expiresAt').notNull(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), createdAt: timestamp('createdAt').notNull(), updatedAt: timestamp('updatedAt').notNull(),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), userId: text('userId').notNull(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull(), updatedAt: timestamp('updatedAt').notNull(),
})
export const verification = pgTable('verification', { id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt'), updatedAt: timestamp('updatedAt') })
export const missions = pgTable('missions', { id: text('id').primaryKey(), userId: text('userId').notNull(), agentId: text('agentId').notNull(), title: text('title').notNull(), destination: text('destination').notNull(), status: text('status').notNull(), riskLevel: text('riskLevel').notNull(), notes: jsonb('notes').$type<string[]>().notNull(), createdAt: timestamp('createdAt').notNull() })
