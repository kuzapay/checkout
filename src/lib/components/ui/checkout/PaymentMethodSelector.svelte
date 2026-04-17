<script lang="ts">
		import {Smartphone,Users,Briefcase} from 'lucide-svelte';

	// Ensure props have default values
	let { selectedPaymentMethod = 'b2c', onPaymentMethodChange = null } = $props();

	type PaymentMethod = {
		id: string;
		name: string;
		description: string;
		icon: any;
		available: boolean;
		comingSoon: boolean;
	};

	const paymentMethods: PaymentMethod[] = [
		{
			id: 'b2c',
			name: 'Personal Payment (B2C)',
			description: 'Send money to individuals via M-Pesa',
			icon: Users,
			available: true,
			comingSoon: false
		},
		{
			id: 'b2b',
			name: 'Business Payment (B2B)',
			description: 'Pay businesses via Paybill/Till',
			icon: Briefcase,
			available: true,
			comingSoon: false
		}
	];

	function handlePaymentMethodSelect(methodId: string) {
		if (onPaymentMethodChange) {
			onPaymentMethodChange(methodId);
		}
	}
</script>

<section class="mb-6">
	<h2 class="text-lg font-semibold text-gray-900 mb-4">M-Pesa Payment Type</h2>
	
	<div class="space-y-3">
		{#each paymentMethods as method (method.id)}
			<button
				type="button"
				class="w-full p-4 rounded-lg border-2 transition-all {selectedPaymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'} {method.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}"
				onclick={() => !method.comingSoon && onPaymentMethodChange ? onPaymentMethodChange(method.id) : null}
				disabled={method.comingSoon}
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<method.icon class="h-6 w-6 text-gray-600" />
						<span class="font-medium text-gray-900">{method.name}</span>
					</div>
					<div class="flex items-center space-x-2">
						{#if method.comingSoon}
							<span class="text-sm text-gray-500">Coming Soon</span>
						{:else if selectedPaymentMethod === method.id}
							<div class="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
								<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							</div>
						{:else}
							<div class="h-5 w-5 rounded-full border-2 border-gray-300"></div>
						{/if}
					</div>
				</div>
			</button>
		{/each}
	</div>
</section>


