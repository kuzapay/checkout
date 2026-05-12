<script lang="ts">
	// import Phone from 'lucide-svelte/Phone';
	// import Lock from 'lucide-svelte/Lock';
	// import LoaderCircle from 'lucide-svelte/LoaderCircle';
	// import ArrowRight from 'lucide-svelte/ArrowRight';
	import { Phone, Mail, Lock, LoaderCircle, ArrowRight } from 'lucide-svelte';

	let {
		phoneNumber,
		customerEmail = '',
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
	<h2 class="mb-4 text-lg font-semibold text-gray-900">Payment Details</h2>

	<div class="space-y-4">
		<!-- Phone Number Input -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700" for="phone-input">
				Phone Number <span class="text-red-500">*</span>
			</label>
			<div class="relative">
				<Phone class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
				<input
					id="phone-input"
					type="tel"
					placeholder="07XX XXX XXX"
					value={phoneNumber}
					oninput={handlePhoneChange}
					class="w-full rounded-xl border border-slate-300 py-3 pr-3 pl-10 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-accent focus:shadow-md focus:ring-2 focus:ring-accent focus:outline-none"
					{disabled}
				/>
			</div>
		</div>

		<!-- Email Input -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700" for="email-input">
				Email Address <span class="text-gray-400">(Optional)</span>
			</label>
			<div class="relative">
				<Mail class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
				<input
					id="email-input"
					type="email"
					placeholder="your@email.com"
					bind:value={customerEmail}
					class="w-full rounded-xl border border-slate-300 py-3 pr-3 pl-10 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-accent focus:shadow-md focus:ring-2 focus:ring-accent focus:outline-none"
					{disabled}
				/>
			</div>
		</div>

		<!-- Amount Display -->
		{#if currentAmount}
			<div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
			class="btn flex w-full items-center justify-center gap-2"
		>
			{#if isSubmitting}
				<LoaderCircle class="h-4 w-4 animate-spin" />
				Processing...
			{:else if useCase === 'subscription'}
				<span
					>Subscribe Now - KES {currentAmount ? Number(currentAmount).toLocaleString() : '0'}</span
				>
				<ArrowRight class="h-4 w-4" />
			{:else}
				<span
					>Complete Payment - KES {currentAmount
						? Number(currentAmount).toLocaleString()
						: '0'}</span
				>
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
