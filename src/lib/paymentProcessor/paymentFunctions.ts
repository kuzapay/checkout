import {
	CONSUMER_KEY,
	CONSUMER_SECRET,
	PASS_KEY,
	CALLBACK_URL,
	BUSINESS_SHORT_CODE
} from '$env/static/private';
interface StkPushPayload {
	BusinessShortCode: string;
	Password: string;
	Timestamp: string;
	TransactionType: string;
	Amount: number;
	PartyA: string;
	PartyB: string;
	PhoneNumber: string;
	CallBackURL: string;
	AccountReference: string;
	TransactionDesc: string;
}

interface StkPushResponse {
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResponseCode: string;
	ResponseDescription: string;
	CustomerMessage: string;
}

interface ReversalRequestPayload {
	Initiator: string;
	SecurityCredential: string; // not Password
	CommandID: string;
	TransactionID: string;
	Amount: number;
	ReceiverParty: string;
	ReceiverIdentifierType: number;
	ResultURL: string;
	QueueTimeOutURL: string;
	Remarks: string;
	Occasion?: string;
}
interface StkCheckStatusPayload {
	BusinessShortCode: string;
	Password: string;
	Timestamp: string;
	CheckoutRequestID: string;
}

interface StkCheckStatusResponse {
	ResponseCode: string;
	ResponseDescription: string;
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResultCode?: string;
	ResultDesc?: string;
}

interface B2CPayload {
	InitiatorName: string;
	SecurityCredential: string;
	CommandID: string;
	Amount: number;
	PartyA: string;
	PartyB: string;
	Remarks: string;
	QueueTimeOutURL: string;
	ResultURL: string;
	Occasion?: string;
}

interface B2CResponse {
	ConversationID: string;
	OriginatorConversationID: string;
	ResponseCode: string;
	ResponseDescription: string;
}

interface B2BPayload {
	Initiator: string;
	SecurityCredential: string;
	CommandID: string;
	SenderIdentifierType: number;
	RecieverIdentifierType: number;
	Amount: number;
	PartyA: string;
	PartyB: string;
	AccountReference: string;
	Remarks: string;
	QueueTimeOutURL: string;
	ResultURL: string;
}

interface B2BResponse {
	ConversationID: string;
	OriginatorConversationID: string;
	ResponseCode: string;
	ResponseDescription: string;
}

export function normalizePhoneNumber(input: string): string | null {
	const cleaned = input.replace(/\s+/g, '');

	// +2547XXXXXXXX → 2547XXXXXXXX
	if (cleaned.startsWith('+254')) {
		return cleaned.slice(1);
	}

	// 07XXXXXXXX or 01XXXXXXXX → 2547XXXXXXXX / 2541XXXXXXXX
	if (/^(07|01)\d{8}$/.test(cleaned)) {
		return '254' + cleaned.slice(1);
	}

	// 2547XXXXXXXX or 2541XXXXXXXX
	if (/^254(7|1)\d{8}$/.test(cleaned)) {
		return cleaned;
	}

	return null;
}

export const getTimestamp = () => {
	const date = new Date();
	return (
		date.getFullYear() +
		String(date.getMonth() + 1).padStart(2, '0') +
		String(date.getDate()).padStart(2, '0') +
		String(date.getHours()).padStart(2, '0') +
		String(date.getMinutes()).padStart(2, '0') +
		String(date.getSeconds()).padStart(2, '0')
	);
};

export const getPassword = (timestamp: string) => {
	const password = `${BUSINESS_SHORT_CODE}${PASS_KEY}${timestamp}`;
	return Buffer.from(password).toString('base64');
};

export const getAccessToken = async () => {
	const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

	const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

	const response = await fetch(url, {
		headers: {
			Authorization: `Basic ${auth}`
		}
	});

	if (!response.ok) {
		throw new Error('Failed to get access token');
	}

	const data = await response.json();
	return data.access_token;
};

export async function initialize_mpesa_stk_push(
	payload: StkPushPayload,
	accessToken: string
): Promise<StkPushResponse> {
	const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
	

	return await response.json();
}

export async function initialize_mpesa_reversal_Request(
	payload: ReversalRequestPayload,
	accessToken: string
) {
	return await fetch('https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});
}

export async function check_transaction_status(
	checkoutRequestId: string
): Promise<StkCheckStatusResponse> {

	const accessToken = await getAccessToken();
	const timestamp = getTimestamp();
	
	const password = getPassword(timestamp);

	const payload: StkCheckStatusPayload = {
		BusinessShortCode: BUSINESS_SHORT_CODE,
		Password: password,
		Timestamp: timestamp,
		CheckoutRequestID: checkoutRequestId
	};

	const response = await fetch(
		'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		}
	);

	if (!response.ok) {
		throw new Error('STK Query failed');
	}

	return await response.json();
}

export async function initialize_b2c_payment(
	payload: B2CPayload,
	accessToken: string
): Promise<B2CResponse> {
	const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		throw new Error('B2C payment request failed');
	}

	return await response.json();
}

export async function initialize_b2b_payment(
	payload: B2BPayload,
	accessToken: string
): Promise<B2BResponse> {
	const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/b2b/v1/paymentrequest', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		throw new Error('B2B payment request failed');
	}

	return await response.json();
}

export function validateB2CPhoneNumber(phoneNumber: string): boolean {
	const normalized = normalizePhoneNumber(phoneNumber);
	return normalized !== null && /^2547\d{8}$/.test(normalized);
}

export function validatePaybillNumber(paybillNumber: string): boolean {
	return /^\d{5,6}$/.test(paybillNumber);
}

export function validateTillNumber(tillNumber: string): boolean {
	return /^\d{6}$/.test(tillNumber);
}