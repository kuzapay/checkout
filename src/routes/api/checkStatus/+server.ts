import { json } from '@sveltejs/kit';
import { userCheckouts, mpesaTransactions } from '$lib/server/db/schemas/transactional';
import { decrypt } from '$lib/cryptography';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { check_transaction_status } from '$lib/paymentProcessor/paymentFunctions';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const encryptedTrackingID = body?.trackingID;

		if (!encryptedTrackingID) {
			return json({ ok: false, message: 'Missing trackingID' }, { status: 400 });
		}

		// -----------------------------
		// Validate trackingID
		// -----------------------------
		try {
			decrypt(encryptedTrackingID);
		} catch (err) {
			console.error('Decrypt error:', err);
			return json({ ok: false, message: 'Invalid trackingID' }, { status: 400 });
		}

		// -----------------------------
		// Fetch Transaction
		// -----------------------------
		const transaction = await db
			.select()
			.from(mpesaTransactions)
			.where(eq(mpesaTransactions.trackingId, encryptedTrackingID))
			.limit(1)
			.then((res) => res[0]);

		if (!transaction) {
			return json({ ok: false, message: 'Transaction not found' }, { status: 404 });
		}

		let status = transaction.status?.toLowerCase();

		// -----------------------------
		// If pending → Query Daraja
		// -----------------------------
		if (status === 'pending' && transaction.checkoutRequestId) {
			try {
				const stkStatus = await check_transaction_status(
					transaction.checkoutRequestId
				);

				console.log('STK QUERY RESPONSE:', stkStatus);

				// SUCCESS
				if (stkStatus.ResultCode === '0') {
					await db
						.update(mpesaTransactions)
						.set({
							status: 'processed'
						})
						.where(eq(mpesaTransactions.id, transaction.id));

					status = 'processed';
				}

				// USER CANCELLED
				else if (stkStatus.ResultCode === '1032') {
					await db
						.update(mpesaTransactions)
						.set({
							status: 'failed'
						})
						.where(eq(mpesaTransactions.id, transaction.id));

					status = 'failed';
				}

				// STILL PROCESSING
				else {
					return json(
						{ ok: true, status: 'PENDING' },
						{ status: 202 }
					);
				}
			} catch (err) {
				console.error('STK QUERY ERROR:', err);

				return json(
					{ ok: true, status: 'PENDING' },
					{ status: 202 }
				);
			}
		}

		// -----------------------------
		// FAILED
		// -----------------------------
		if (status === 'failed') {
			return json({ ok: false, status: 'FAILED' }, { status: 400 });
		}

		// -----------------------------
		// SUCCESS / PROCESSED
		// -----------------------------
		if (status === 'processed') {
			// Prevent double disbursement
			if (!transaction.isDisbursed) {
				const checkout = await db
					.select()
					.from(userCheckouts)
					.where(eq(userCheckouts.checkoutId, transaction.checkoutId!))
					.limit(1)
					.then((res) => res[0]);

				const currentAmount = Number(checkout?.amountReceived || 0);
				const receivedAmount = Number(transaction.amountReceived || 0);

				const newAmount = currentAmount + receivedAmount;

				await db
					.update(userCheckouts)
					.set({
						amountReceived: newAmount.toString()
					})
					.where(eq(userCheckouts.checkoutId, transaction.checkoutId!));

				await db
					.update(mpesaTransactions)
					.set({
						isDisbursed: true
					})
					.where(eq(mpesaTransactions.id, transaction.id));
			}

			return json(
				{
					ok: true,
					status: 'SUCCESS'
				},
				{ status: 200 }
			);
		}

		// -----------------------------
		// Unknown state
		// -----------------------------
		return json(
			{ ok: false, message: 'Unknown transaction state' },
			{ status: 400 }
		);
	} catch (error) {
		console.error('CHECK_STATUS_ERROR:', error);

		return json(
			{ ok: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
}