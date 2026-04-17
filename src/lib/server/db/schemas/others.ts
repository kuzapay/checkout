import { timestamp, varchar, text, pgTable, boolean } from 'drizzle-orm/pg-core';

export const waitlistTable = pgTable('waitlist', {
	id: text('id').primaryKey(),
	email: varchar('email', { length: 255 }).notNull(),
	created_at: timestamp('created_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const contactUsTable = pgTable('contactUs', {
	id: text('id').primaryKey(),
	name: text('name').notNull().default('anonymous'),
	email: text('email').notNull().default('anonymous'),
	subject: varchar('subject').notNull(),
	message: varchar('message'),
	isResponsed: boolean('is_responded'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});
