import { pgTable, text, timestamp, boolean, index, integer, unique } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const shops = pgTable('shops', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  shopName: text('shop_name').notNull().default(''),
  shopDescription: text('shop_description').notNull().default(''),
  logoUrl: text('logo_url'),
  logoPublicId: text('logo_public_id'), // For Cloudinary cleanup
  bannerUrl: text('banner_url'),
  bannerPublicId: text('banner_public_id'), // For Cloudinary cleanup
  websiteUrl: text('website_url'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  facebook: text('facebook'),
  isVerified: boolean('is_verified').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  averageRating: text('average_rating').default('0'),
  reviewCount: integer('review_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => [
  index('shops_user_id_idx').on(table.userId),
  index('shops_is_verified_idx').on(table.isVerified),
  index('shops_is_featured_idx').on(table.isFeatured),
  index('shops_is_active_idx').on(table.isActive),
  unique('shops_user_shop_name_unique').on(table.userId, table.shopName), // Unique shop name per user
]);
