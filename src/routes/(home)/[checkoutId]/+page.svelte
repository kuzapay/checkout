<script lang="ts">
	import { Lock } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { PricingSection} from '$lib/components/ui/checkout';
	import PaymentForm from '$lib/components/ui/checkout/PaymentForm.svelte';


	const { data } = $props();

	// Type definition for tiers
	type Tier = {
		id: string;
		amount: string | number;
		label: string;
		enabled?: boolean;
		tier?: number;
	};

	// -----------------------------
	// Backend response handling
	// -----------------------------
	const isValid = $derived(data?.ok === true);
	const status = $derived( data?.status);
	const pageError = $derived(!isValid ? data?.message : '');

	const checkout = $derived(isValid ? data?.queriedCheckout : null);
	const username = $derived(isValid ? data?.userName?.[0]?.name : null);


	const checkoutId = $derived(checkout?.checkoutId);
	const checkoutTitle = $derived(checkout?.title);
	const hasTiers = $derived(checkout?.hasTiers);

	// -----------------------------
	// Use Case Detection
	// -----------------------------
	const useCase = $derived({
		type: checkout?.checkoutType === 'recurrent' ? 'subscription' : 'onetime',
		pricing: checkout?.hasFixedAmount ? 'fixed' : checkout?.hasTiers ? 'tiered' : 'custom',
		frequency: checkout?.paymentFrequency,
		fixedAmount: checkout?.fixedAmount
	});

	// Calculate next billing date for subscriptions
	const nextBillingDate = $derived(() => {
		if (useCase.type !== 'subscription' || !checkout?.paymentFrequency) return null;
		
		const now = new Date();
		const frequency = checkout.paymentFrequency;
		
		switch (frequency) {
			case 'daily':
				return new Date(now.setDate(now.getDate() + 1));
			case 'weekly':
				return new Date(now.setDate(now.getDate() + 7));
			case 'monthly':
				return new Date(now.setMonth(now.getMonth() + 1));
			case 'yearly':
				return new Date(now.setFullYear(now.getFullYear() + 1));
			default:
				return null;
		}
	});

	// Extract tiers as array for easier handling
	const tiers = $derived.by(() => {
		if (!hasTiers) return [];
		
		// Try new JSON format first
		if (checkout?.tiers) {
			try {
				const parsedTiers = typeof checkout.tiers === 'string' ? JSON.parse(checkout.tiers) : checkout.tiers;
				return parsedTiers.filter((tier: Tier) => tier.enabled && tier.label && tier.amount);
			} catch (error) {
				console.error('Failed to parse tiers JSON:', error);
			}
		}
		
		// Fallback to old format for backward compatibility
		const tierArray = [];
		for (let i = 1; i <= 5; i++) {
			const amountKey = `tier${i}Amount` as keyof typeof checkout;
			const labelKey = `tier${i}Label` as keyof typeof checkout;
			const amount = checkout?.[amountKey];
			const label = checkout?.[labelKey];
			if (amount && label) {
				tierArray.push({ 
					id: `tier-${i}`, // Generate ID for backward compatibility
					amount, 
					label, 
					tier: i 
				});
			}
		}
		return tierArray;
	});

	// -----------------------------
	// State
	// -----------------------------
	let phoneNumber = $state('');
	let selectedTier = $state<string | null>(null);
	let customAmount = $derived(checkout?.hasFixedAmount ? checkout.fixedAmount ?? '' : '');
	
	let loading = $state(false);
	let polling = $state(false);
	let success = $state(false);
	let error = $state('');

	// Event handlers for components
	function handleTierSelect(tierId: string) {
		selectedTier = tierId;
	}

	function handleAmountChange(amount: string) {
		customAmount = amount;
	}

	function handlePhoneNumberChange(phone: string) {
		phoneNumber = phone;
	}

	function handlePaymentSubmit() {
		processTransaction();
	}

	// Get current amount based on selection
	let currentAmount = $derived.by(() => {
		if (hasTiers && tiers.length > 0 && selectedTier) {
			const selectedTierData = tiers.find((tier: Tier) => 
				tier.id === selectedTier || (tier.tier && `tier-${tier.tier}` === selectedTier)
			);
			return selectedTierData?.amount || '';
		}
		return customAmount;
	});

	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Check for existing encrypted tracking ID on page load
	$effect(() => {
		if (!checkoutId) return;
		
		const storageKey = `kuzapay_tracking_${checkoutId}`;
		const savedTrackingId = localStorage.getItem(storageKey);
		
		if (savedTrackingId) {
			// Resume polling for existing transaction
			startPolling(savedTrackingId);
		}
	});

	// -----------------------------
	// Derived
	// -----------------------------
	const formattedAmount = $derived(
		currentAmount
			? Number(currentAmount).toLocaleString('en-KE', {
					minimumFractionDigits: 2
				})
			: '0.00'
	);

	
	// -----------------------------
	// Phone normalization (from backup)
	// -----------------------------
	function normalizePhoneNumber(input: string): string | null {
		const cleaned = input.replace(/\s+/g, '');
		if (cleaned.startsWith('+254')) return cleaned.slice(1);
		if (/^(07|01)\d{8}$/.test(cleaned)) return '254' + cleaned.slice(1);
		if (/^254(7|1)\d{8}$/.test(cleaned)) return cleaned;
		return null;
	}

	// -----------------------------
	// Polling (from backup)
	// -----------------------------
	function startPolling(trackingID: string) {
		if (pollInterval) clearInterval(pollInterval);

		polling = true;

		pollInterval = setInterval(async () => {
			try {
				const res = await fetch('/api/checkStatus', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ trackingID })
				});

				const data = await res.json();

				if (!res.ok) return;

				if (data.status === 'SUCCESS') {
					clearInterval(pollInterval!);
					pollInterval = null;
					polling = false;
					success = true;
					
					// Clean up localStorage on success
					const storageKey = `kuzapay_tracking_${checkoutId}`;
					localStorage.removeItem(storageKey);
				}

				if (data.status === 'FAILED') {
					clearInterval(pollInterval!);
					pollInterval = null;
					polling = false;
					error = 'Transaction failed or was cancelled.';
					
					// Clean up localStorage on failure
					const storageKey = `kuzapay_tracking_${checkoutId}`;
					localStorage.removeItem(storageKey);
				}

				if (data.status === 'PENDING') {
					polling = true;
				}
			} catch (err) {
				console.error('Polling error:', err);
			}
		}, 3000);

		// safety timeout
		setTimeout(() => {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
				polling = false;
				error = 'Transaction confirmation timed out. Please try again.';
				
				// Clean up localStorage on timeout
				const storageKey = `kuzapay_tracking_${checkoutId}`;
				localStorage.removeItem(storageKey);
			}
		}, 120000);
	}

	// -----------------------------
	// Trigger STK push (from backup)
	// -----------------------------
	async function processTransaction() {
		error = '';
		success = false;

		const normalizedPhone = normalizePhoneNumber(phoneNumber);

		if (!normalizedPhone) {
			error = 'Enter a valid Kenyan phone number';
			return;
		}

		if (!currentAmount || Number(currentAmount) <= 0) {
			error = 'Enter a valid amount';
			return;
		}

		loading = true;

		try {
			const res = await fetch('/api/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phoneNumber: normalizedPhone,
					amount: currentAmount,
					checkoutId
				})
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error();
			}

			// Save encrypted tracking ID to localStorage for persistence
			const storageKey = `kuzapay_tracking_${checkoutId}`;
			localStorage.setItem(storageKey, data.trackingID);
			
			startPolling(data.trackingID);
		} catch {
			error = 'Failed to send STK push. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Cleanup polling on unmount
	$effect(() => {
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
			}
		};
	}) 
</script>



{#if !isValid}
	<!-- ERROR SCREEN -->
	<div
		class="flex min-h-screen items-center justify-center bg-background px-4"
		in:fly={{ duration: 400 }}
	>
		<div class="bg-card rounded-xl border w-full max-w-md p-8 text-center shadow-sm">
			<div class="mb-6">
				<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-xl font-bold text-destructive">
					!
				</div>
			</div>

			<h2 class="mb-3 text-xl font-semibold text-foreground">
				{status === 400
					? 'Checkout not found'
					: status === 422
						? 'Invalid payment link'
						: 'Something went wrong'}
			</h2>

			<p class="text-muted-foreground mb-6">
				{pageError || 'This payment link is invalid or no longer available.'}
			</p>

			<a
				href="/"
				class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-foreground hover:bg-foreground/90 transition-colors"
			>
				Return home
			</a>
		</div>
	</div>
{:else}
	<!-- STRIPE-LIKE MULTI-COLUMN CHECKOUT DESIGN -->
	<div class="min-h-screen bg-slate-100">
		<div class="max-w-6xl mx-auto pt-8 pb-16 px-4">
			<!-- Header -->
			<div class="mb-8">
				<div class="flex items-center justify-between mb-6">
					<div class="text-3xl font-bold text-slate-900">
						{#if useCase?.type === 'subscription'}
							Subscribe to {checkoutTitle || 'Service'}
						{:else}
							Complete Your Purchase
						{/if}
					</div>
					<div class="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">Secure checkout</div>
				</div>
				
			</div>

			<!-- Recipient Information Card -->
			<div class="mb-8">
				<div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-gray-900">Payment Recipient</h3>
						<div class="px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent">
							{username?.toUpperCase() || 'USER'}
						</div>
					</div>
					
					<div class="flex items-center space-x-4">
						<div class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
							<span class="text-lg font-semibold text-slate-600">
								{username?.charAt(0) || 'U'}
							</span>
						</div>
						<div>
							<div class="font-medium text-gray-900">
								{username || 'User'}
							</div>
							<div class="text-sm text-slate-500">
								{#if useCase?.type === 'subscription'}
									Subscription Provider
								{:else}
									Payment Recipient
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Left Column - Payment Form (2/3 width on large screens) -->
				<div class="lg:col-span-2">
					<div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
						<!-- Pricing Section -->
						<PricingSection 
							hasTiers={hasTiers}
							tiers={tiers}
							customAmount={customAmount}
							selectedTier={selectedTier}
							onTierSelect={handleTierSelect}
							onAmountChange={handleAmountChange}
						/>
						
						<!-- Subscription Billing Information -->
						{#if useCase?.type === 'subscription'}
							<div class="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
								<h3 class="text-sm font-semibold text-accent mb-2">Billing Information</h3>
								<div class="space-y-1 text-sm text-slate-700">
									<div class="flex items-center gap-2">
										<div class="h-2 w-2 rounded-full bg-accent"></div>
										Billed {useCase.frequency}
									</div>
									{#if nextBillingDate()}
										<div class="flex items-center gap-2">
											<div class="h-2 w-2 rounded-full bg-accent/60"></div>
											Next billing date: {nextBillingDate()!.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Payment Form -->
						<PaymentForm 
							phoneNumber={phoneNumber}
							onPhoneNumberChange={handlePhoneNumberChange}
							onSubmit={handlePaymentSubmit}
							currentAmount={currentAmount}
							isSubmitting={loading}
							disabled={!isValid}
							useCase={useCase?.type}
						/>

						<!-- Transaction Status Indicators -->
						{#if polling}
							<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
								<div class="flex items-center gap-3">
									<div class="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
									<div>
										<h4 class="text-sm font-semibold text-blue-900">Processing Transaction</h4>
										<p class="text-sm text-blue-700">Waiting for M-Pesa confirmation. Please check your phone.</p>
									</div>
								</div>
							</div>
						{/if}

						{#if success}
							<div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
								<div class="flex items-center gap-3">
									<div class="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center">
										<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
										</svg>
									</div>
									<div>
										<h4 class="text-sm font-semibold text-green-900">Payment Successful</h4>
										<p class="text-sm text-green-700">Your transaction has been completed successfully.</p>
									</div>
								</div>
							</div>
						{/if}

						{#if error}
							<div class="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
								<div class="flex items-center gap-3">
									<div class="h-5 w-5 bg-red-600 rounded-full flex items-center justify-center">
										<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
										</svg>
									</div>
									<div>
										<h4 class="text-sm font-semibold text-red-900">Transaction Failed</h4>
										<p class="text-sm text-red-700">{error}</p>
										<button 
											class="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
											onclick={processTransaction}
										>
											Try Again
										</button>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Column - Order Summary (1/3 width on large screens) -->
				<div class="lg:col-span-1">
					<div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sticky top-8">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
						
						<!-- Checkout Details -->
						<div class="space-y-3 mb-6">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Checkout</span>
								<span class="font-medium text-gray-900">{checkoutTitle || 'Payment'}</span>
							</div>
							
							{#if useCase?.type === 'subscription'}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">Payment Type</span>
									<span class="font-medium text-gray-900">Subscription</span>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">Billing Cycle</span>
									<span class="font-medium text-gray-900">{useCase.frequency}</span>
								</div>
							{:else}
								<div class="flex justify-between text-sm">
									<span class="text-gray-600">Payment Type</span>
									<span class="font-medium text-gray-900">One-time</span>
								</div>
							{/if}
							
							{#if hasTiers && selectedTier}
								{@const selectedTierData = tiers.find((tier: Tier) => tier.id === selectedTier || (tier.tier && `tier-${tier.tier}` === selectedTier))}
								{#if selectedTierData}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">Selected Tier</span>
										<span class="font-medium text-gray-900">{selectedTierData.label}</span>
									</div>
								{/if}
							{/if}
							
							<div class="flex justify-between text-sm">
								<span class="text-gray-600">Payment Method</span>
								<span class="font-medium text-gray-900">M-Pesa</span>
							</div>
						</div>

						<!-- Total Amount -->
						<div class="border-t border-gray-200 pt-4 mb-6">
							<div class="flex justify-between items-center">
								<span class="text-base font-medium text-gray-900">Total</span>
								<span class="text-2xl font-bold text-gray-900">
									KES {formattedAmount}
								</span>
							</div>
						</div>

						<!-- Security Badge -->
						<div class="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-200">
							<Lock class="h-3 w-3" />
							<span>Secured by Kuzapay</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="mt-12 text-center">
				<p class="text-xs text-gray-500 mb-2">Secured by Kuzapay</p>
				<div class="flex justify-center gap-4 text-xs text-gray-500">
					<a href="/privacy" class="hover:text-gray-700 transition-colors">Privacy Policy</a>
					<a href="/terms" class="hover:text-gray-700 transition-colors">Terms of Service</a>
				</div>
			</div>
		</div>
	</div>
{/if}
