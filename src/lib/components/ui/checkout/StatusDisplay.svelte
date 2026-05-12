<script lang="ts">
	// import  CircleCheck from 'lucide-svelte/ CircleCheck';
	// import  CircleX from 'lucide-svelte/ CircleX';
	// import LoaderCircle from 'lucide-svelte/LoaderCircle';
	// import  CircleAlert from 'lucide-svelte/ CircleAlert';
	import { CircleCheck, CircleX, LoaderCircle, CircleAlert } from 'lucide-svelte';

	let { loading, success, error, polling } = $props();
</script>

{#if loading || polling}
	<section class="col-span-1 rounded-xl border bg-card p-8 shadow-sm md:col-span-3">
		<div class="text-center">
			<div
				class="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full"
			>
				<LoaderCircle class="text-primary h-8 w-8 animate-spin" />
			</div>
			<h2 class="mb-2 text-xl font-semibold">
				{#if polling}
					Waiting for Payment
				{:else}
					Processing Payment
				{/if}
			</h2>
			<p class="text-muted-foreground">
				{#if polling}
					Please check your phone and complete the M-Pesa transaction
				{:else}
					Please wait while we process your payment
				{/if}
			</p>
		</div>
	</section>
{:else if success}
	<section
		class="col-span-1 rounded-xl border border-green-200 bg-green-50 p-8 shadow-sm md:col-span-3"
	>
		<div class="text-center">
			<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
				<CircleCheck class="h-8 w-8 text-green-600" />
			</div>
			<h2 class="mb-2 text-xl font-semibold text-green-800">Payment Successful!</h2>
			<p class="text-green-700">Your payment has been processed successfully</p>
		</div>
	</section>
{:else if error}
	<section
		class="col-span-1 rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm md:col-span-3"
	>
		<div class="text-center">
			<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
				<CircleX class="h-8 w-8 text-red-600" />
			</div>
			<h2 class="mb-2 text-xl font-semibold text-red-800">Payment Failed</h2>
			<p class="text-red-700">{error}</p>
		</div>
	</section>
{:else}
	<!-- Empty state when no status is shown -->
	<section class="col-span-1 rounded-xl border bg-card p-6 shadow-sm">
		<div class="text-muted-foreground text-center">
			<CircleAlert class="mx-auto mb-2 h-8 w-8 opacity-50" />
			<p class="text-sm">Complete the form to proceed with payment</p>
		</div>
	</section>
{/if}
