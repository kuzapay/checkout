import { pgTable, timestamp, text, boolean, json, integer, numeric, pgEnum, index } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { shops } from './shops';

export const userCheckouts = pgTable('user_checkouts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  checkoutId: text('checkout_id').notNull().unique(), //Generated checkoutID will be used in the slug link shared
  title: text('title').notNull(),
  checkoutType: text('checkout_type').notNull().default('standard'),
  hasFixedAmount: boolean('has_fixed_amount').notNull().default(false),
  fixedAmount: text('fixed_amount'),
  isRecurrent: boolean('is_recurrent').notNull().default(false),
  paymentFrequency: text('payment_frequency'),
  amountReceived: text('amount_received').default('0'),
  isActive: boolean('is_active').notNull().default(true),
  posterImage: text('poster_image'), // URL to poster image
  bannerImage: text('banner_image'), // URL to banner image
  // Tiered pricing fields
  hasTiers: boolean('has_tiers').notNull().default(false),
  tiers: json('tiers'), // JSON field for storing tier data
  tier1Amount: text('tier1_amount'), // e.g., "100"
  tier1Label: text('tier1_label'), // e.g., "Basic"
  tier2Amount: text('tier2_amount'), // e.g., "200"
  tier2Label: text('tier2_label'), // e.g., "Standard"
  tier3Amount: text('tier3_amount'), // e.g., "300"
  tier3Label: text('tier3_label'), // e.g., "Premium"
  tier4Amount: text('tier4_amount'), // e.g., "500"
  tier4Label: text('tier4_label'), // e.g., "Professional"
  tier5Amount: text('tier5_amount'), // e.g., "1000"
  tier5Label: text('tier5_label'), // e.g., "Enterprise"
  // New fields for enhanced functionality
  expiresAt: timestamp('expires_at').defaultNow(),
  analytics: json('analytics').default('{}'),
  deletedAt: timestamp('deleted_at'),
  maxDurationDays: integer('max_duration_days').default(30),
  disbursementThreshold: text('disbursement_threshold').default('150'), // Default 150 KES
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
});


// Updated mpesaTransactions with order linkage and idempotency
export const mpesaTransactions = pgTable('mpesa_transactions', {
  id: text('id').primaryKey(),
  checkoutId: text('checkout_id'),
  trackingId: text('tracking_id'), //used in the frontend to check the status of the transaction
  checkoutRequestId: text('checkout_request_id'),
  merchantRequestId: text('merchant_request_id'),
  receiptNumber: text('receipt_number').unique(), // idempotency: unique receipt number from M-Pesa
  amountReceived: text('amount_received'),
  receivedFrom: text('received_from'),
  customerEmail: text('customer_email'), // Customer email for receipt sending
  status: text('status').default('pending'),
  isReversed: boolean().notNull().default(false),
  isDisbursed: boolean().notNull().default(false),
  transactedAt: timestamp('transaction_time').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull()
}, (table) => [
  index('mpesa_transactions_checkout_id_idx').on(table.checkoutId),
  index('mpesa_transactions_receipt_number_idx').on(table.receiptNumber),
]);



// Checkout analytics table for detailed tracking
export const checkoutAnalytics = pgTable('checkout_analytics', {
  id: text('id').primaryKey(),
  checkoutId: text('checkout_id')
    .notNull()
    .references(() => userCheckouts.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(), // Date for daily analytics
  transactionCount: integer('transaction_count').default(0),
  totalRevenue: numeric('total_revenue').default('0'),
  uniqueVisitors: integer('unique_visitors').default(0),
  conversionRate: numeric('conversion_rate').default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => [
  index('checkout_analytics_checkout_id_idx').on(table.checkoutId),
  index('checkout_analytics_date_idx').on(table.date)
]);
