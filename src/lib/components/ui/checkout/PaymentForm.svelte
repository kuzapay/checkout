<script lang="ts">
	// import Phone from 'lucide-svelte/Phone';
	// import Lock from 'lucide-svelte/Lock';
	// import LoaderCircle from 'lucide-svelte/LoaderCircle';
	// import ArrowRight from 'lucide-svelte/ArrowRight';
	import { Phone,Lock,LoaderCircle,ArrowRight } from 'lucide-svelte';

	let { 
		phoneNumber, 
		onPhoneNumberChange, 
		onSubmit, 
		currentAmount, 
		isSubmitting, 
		disabled,
		useCase = 'onetime'
	} = $props();

	function handlePhoneChange(event: Event) {
		if (onPhoneNumberChange) {
			onPhoneNumberChange((event.target as HTMLInputElement).value);
		}
	}

	function handleSubmit() {
		if (onSubmit && !disabled) {
			onSubmit();
		}
	}
</script>

<section class="mb-6">
	<h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
	
	<div class="space-y-4">
		<!-- Phone Number Input -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2" for="phone-input">
				Phone Number <span class="text-red-500">*</span>
			</label>
			<div class="relative">
				<Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
				<input
					id="phone-input"
					type="tel"
					placeholder="07XX XXX XXX"
					value={phoneNumber}
					oninput={handlePhoneChange}
					class="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-slate-900 placeholder-slate-400 shadow-sm focus:shadow-md transition-all"
					disabled={disabled}
				/>
			</div>
		</div>
		
		<!-- Amount Display -->
		{#if currentAmount}
			<div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-slate-600">Total Amount</span>
					<span class="text-2xl font-bold text-slate-900">
						KES {Number(currentAmount).toLocaleString()}
					</span>
				</div>
			</div>
		{/if}

		<!-- Submit Button -->
		<button
			type="button"
			onclick={handleSubmit}
			disabled={disabled || !phoneNumber || !currentAmount || isSubmitting}
			class="btn w-full flex items-center justify-center gap-2"
		>
			{#if isSubmitting}
				<LoaderCircle class="h-4 w-4 animate-spin" />
				Processing...
			{:else if useCase === 'subscription'}
				<span>Subscribe Now - KES {currentAmount ? Number(currentAmount).toLocaleString() : '0'}</span>
				<ArrowRight class="h-4 w-4" />
			{:else}
				<span>Complete Payment - KES {currentAmount ? Number(currentAmount).toLocaleString() : '0'}</span>
				<ArrowRight class="h-4 w-4" />
			{/if}
		</button>

		<!-- Security Note -->
		<div class="flex items-center justify-center gap-2 text-xs text-gray-500">
			<Lock class="h-3 w-3" />
			<span>Secured by Kuzapay</span>
		</div>
	</div>
</section>
