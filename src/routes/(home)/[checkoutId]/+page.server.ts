
import type { PageServerLoad } from './$types';

import { user, profile } from '$lib/server/db/schemas/auth-schema';
import { userCheckouts } from '$lib/server/db/schemas/transactional';
import { shops } from '$lib/server/db/schemas/shops';
import { decrypt } from '$lib/cryptography';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const checkoutId = params.checkoutId;

	if (!checkoutId) {
		return { 
			ok: false,
			message: 'The link used is incorrect. Kindly retry',
			status: 422
		};
	}

	try {
		const queriedCheckout = await db
			.select()
			.from(userCheckouts)
			.where(eq(userCheckouts.checkoutId, checkoutId)).limit(1).then((res) => res[0]);

		console.info(queriedCheckout);
		if (!queriedCheckout) {
			return {
				ok: false,
				message: 'The checkout does not exist.',
				status: 400
			};
		}

		

		// Query profile table with user fallback for display name logic
		const userProfile = await db
			.select({
				accountType: profile.accountType,
				displayName: profile.displayName,
				legalFirstName: profile.legalFirstName,
				legalLastName: profile.legalLastName,
				registeredBusinessName: profile.registeredBusinessName,
				organizationName: profile.organizationName,
				userName: user.name
			})
			.from(profile)
			.leftJoin(user, eq(profile.userId, user.id))
			.where(eq(profile.userId, queriedCheckout.userId))
			.limit(1);

		// Calculate display name based on account type with decryption
		let calculatedName = 'User';
		if (userProfile.length > 0) {
			const profile = userProfile[0];
			
			try {
				if (profile.accountType === 'individual') {
					// Decrypt and combine first and last name
					const firstName = profile.legalFirstName ? decrypt(profile.legalFirstName) : '';
					const lastName = profile.legalLastName ? decrypt(profile.legalLastName) : '';
					calculatedName = firstName && lastName ? `${firstName} ${lastName}` : 
									firstName || lastName || profile.displayName || profile.userName || 'User';
				} else if (profile.accountType === 'business') {
					// Decrypt business name
					calculatedName = profile.registeredBusinessName ? decrypt(profile.registeredBusinessName) : 
									profile.displayName || profile.userName || 'User';
				} else if (profile.accountType === 'organization') {
					// Decrypt organization name
					calculatedName = profile.organizationName ? decrypt(profile.organizationName) : 
									profile.displayName || profile.userName || 'User';
				} else {
					// Fallback to display name or user name
					calculatedName = profile.displayName || profile.userName || 'User';
				}
			} catch (decryptError) {
				console.error('Error decrypting profile fields:', decryptError);
				// Fallback to non-encrypted fields
				calculatedName = profile.displayName || profile.userName || 'User';
			}
		}

		// Maintain existing userName structure for compatibility
		const userName = [{ name: calculatedName }];

		const branding = await db
			.select()
			.from(shops)
			.where(eq(shops.userId, queriedCheckout.userId))
			.limit(1);

		return {
			queriedCheckout,
			userName,
			// branding: branding.length > 0 ? branding[0] : null,
			ok: true,
			status: 200
		};
	} catch (error) {
		console.error('ERROR->CLIENT__CHECKOUT__PAGE', error);

		return {
			ok: false,
			message: 'Something unexpected happened. Kindly try again later',
			status: 500
		};
	}
};
