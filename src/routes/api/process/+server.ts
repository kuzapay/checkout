import { json } from '@sveltejs/kit';
import { BUSINESS_SHORT_CODE } from '$env/static/private';

import {
	getTimestamp,
	getPassword,
	getAccessToken,
	initialize_mpesa_stk_push,
	normalizePhoneNumber
} from '$lib/paymentProcessor/paymentFunctions';

import { mpesaTransactions, userCheckouts } from '$lib/server/db/schemas/transactional';
import { profile } from '$lib/server/db/schemas/auth-schema';
import { db } from '$lib/server/db';
import { randomUUID } from 'crypto';
import { encrypt, decrypt } from '$lib/cryptography';
import { eq } from 'drizzle-orm';

export async function POST({ request }) {
	const { phoneNumber, amount, checkoutId } = await request.json();

	if (!phoneNumber || !amount || !checkoutId) {
		return json({ success: false, message: 'Expected request data missing' }, { status: 400 });
	}

	// Normalize phone
	const formattedPhone = normalizePhoneNumber(phoneNumber);

	if (!formattedPhone) {
		return json({ success: false, message: 'Invalid phone number format' }, { status: 400 });
	}

	// Fetch checkout
	const checkout = await db
		.select()
		.from(userCheckouts)
		.where(eq(userCheckouts.checkoutId, checkoutId))
		.limit(1)
		.then((res) => res[0]);
		console.info(checkout)

	if (!checkout) {
		return json({ success: false, message: 'Invalid checkout' }, { status: 404 });
	}

	if (!checkout.isActive) {
		return json({ success: false, message: 'Checkout inactive' }, { status: 400 });
	}

	// Query user profile to get display name for transaction descriptions
	const userProfile = await db
		.select({
			accountType: profile.accountType,
			displayName: profile.displayName,
			legalFirstName: profile.legalFirstName,
			legalLastName: profile.legalLastName,
			registeredBusinessName: profile.registeredBusinessName,
			organizationName: profile.organizationName
		})
		.from(profile)
		.where(eq(profile.userId, checkout.userId))
		.limit(1);

	// Calculate display name based on account type with decryption
	let username = 'User';
	if (userProfile.length > 0) {
		const profile = userProfile[0];
		
		try {
			if (profile.accountType === 'individual') {
				const firstName = profile.legalFirstName ? decrypt(profile.legalFirstName) : '';
				const lastName = profile.legalLastName ? decrypt(profile.legalLastName) : '';
				username = firstName && lastName ? `${firstName} ${lastName}` : 
								firstName || lastName || profile.displayName || 'User';
			} else if (profile.accountType === 'business') {
				username = profile.registeredBusinessName ? decrypt(profile.registeredBusinessName) : 
								profile.displayName || 'User';
			} else if (profile.accountType === 'organization') {
				username = profile.organizationName ? decrypt(profile.organizationName) : 
								profile.displayName || 'User';
			} else {
				username = profile.displayName || 'User';
			}
		} catch (decryptError) {
			console.error('Error decrypting profile fields:', decryptError);
			username = profile.displayName || 'User';
		}
	}

	const numericAmount = Number(amount);

	if (isNaN(numericAmount) || numericAmount <= 0) {
		return json({ success: false, message: 'Invalid amount' }, { status: 400 });
	}

	// Fixed amount enforcement
	if (checkout.hasFixedAmount) {
		const fixedAmount = Number(checkout.fixedAmount);

		if (numericAmount !== fixedAmount) {
			return json(
				{
					success: false,
					message: `This checkout requires a fixed amount of ${fixedAmount}`
				},
				{ status: 400 }
			);
		}
	}

	try {
		const accessToken = await getAccessToken();
		const timestamp = getTimestamp();
		const password = getPassword(timestamp);

		const shortId = checkoutId.slice(0, 6);

		// Determine transaction descriptions based on checkout type
		let accountReference = '';
		let transactionDesc = '';
		
		if (checkout.checkoutType === 'recurrent') {
			// Subscription payment
			const frequency = checkout.paymentFrequency || 'month';
			accountReference = `Subscribe to ${username} for KES ${numericAmount} every ${frequency} via Kuzapay`;
			transactionDesc = `Subscription to ${username} - ${checkout.title} - KES ${numericAmount}/${frequency}`;
		} else {
			// One-time payment
			accountReference = `Pay KES ${numericAmount} to ${username} via Kuzapay`;
			transactionDesc = `Payment to ${username} for ${checkout.title} - KES ${numericAmount}`;
		}

		const payload = {
			BusinessShortCode: BUSINESS_SHORT_CODE,
			Password: password,
			Timestamp: timestamp,
			TransactionType: 'CustomerPayBillOnline',
			Amount: numericAmount,
			PartyA: formattedPhone,
			PartyB: BUSINESS_SHORT_CODE,
			PhoneNumber: formattedPhone,
			CallBackURL:"https://api.kuzapay.app/transaction/process/callback",
			AccountReference: accountReference,
			TransactionDesc: transactionDesc
		};

// };

		const res = await initialize_mpesa_stk_push(payload, accessToken);

		if (res.ResponseCode !== '0') {
			return json(
				{ success: false, message: 'You cancelled the transaction' },
				{ status: 400 }
			);
		}

		// Encrypt the tracking before returning it to the client
		const trackingID = encrypt(randomUUID());

		await db.insert(mpesaTransactions).values({
			id: randomUUID(),
			checkoutId,
			trackingId: trackingID,
			checkoutRequestId: res.CheckoutRequestID,
			merchantRequestId: res.MerchantRequestID,
			receiptNumber: null, // NULL initially, will be updated when payment is confirmed
		});

		return json(
			{
				success: true,
				message: 'STK push sent successfully',
				trackingID
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('ERROR->MPESA__PROCESSING_ERROR', error);

		return json(
			{ success: false, message: 'An internal error occurred kindly try again.' },
			{ status: 500 }
		);
	}
}
