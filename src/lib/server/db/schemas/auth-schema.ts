import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index, json, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});


export const profile = pgTable('profile', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
	accountType: text('account_type'), // 'individual' | 'business' | 'organization'
	displayName: text('display_name'),
	primaryPhoneNumber: text('primary_phone_number'),
	disbursementType: text('disbursement_type').notNull(), // 'b2c' | 'b2b'
	mpesaNumber: text('mpesa_number'),
	mpesaShortCode:text('mpesa_short_code'),
	referralSource: text('referral_source'), // where user heard about us
	
	// KYC Compliance Fields - Individual
	legalFirstName: text('legal_first_name'),
	legalLastName: text('legal_last_name'),
	legalMiddleName: text('legal_middle_name'), // optional
	nationalIdNumber: text('national_id_number'),
	dateOfBirth: text('date_of_birth'),
	
	// KYC Compliance Fields - Business
	registeredBusinessName: text('registered_business_name'),
	businessRegistrationNumber: text('business_registration_number'),
	kraPin: text('kra_pin'),
	
	// KYC Compliance Fields - Organization
	organizationName: text('organization_name'),
	organizationRegistrationNumber: text('organization_registration_number'),
	
	// Common KYC Fields
	officialInChargeName: text('official_in_charge_name'),
	dataConsentConfirmed: boolean('data_consent_confirmed').default(false).notNull(),
	
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	profile: many(profile)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));

export const profileRelations = relations(profile, ({ one }) => ({
	user: one(user, {
		fields: [profile.userId],
		references: [user.id]
	})
}));

export const rateLimits = pgTable('rate_limits', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(), // email address
	endpoint: text('endpoint').notNull(), // otp_resend, password_reset_request, etc.
	requestCount: integer('request_count').default(1).notNull(),
	windowStart: timestamp('window_start').notNull(),
	expiresAt: timestamp('expires_at').notNull()
});

export const otpVerification = pgTable(
	'otp_verifications',
	{
		id: text('id').primaryKey(),

		// email or phone number
		identifier: text('identifier').notNull(),

		// centrally hashed OTP
		codeHash: text('code_hash').notNull(),

		// expiration time
		expiresAt: timestamp('expires_at').notNull(),

		// one-time usage flag
		used: boolean('used').default(false).notNull(),

		// number of failed attempts
		attempts: integer('attempts').default(0).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('otp_identifier_idx').on(table.identifier),
		index('otp_expires_idx').on(table.expiresAt)
	]
);


