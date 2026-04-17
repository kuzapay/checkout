<script lang="ts">
	// import  CircleCheck from 'lucide-svelte/ CircleCheck';
	// import  CircleX from 'lucide-svelte/ CircleX';
	// import LoaderCircle from 'lucide-svelte/LoaderCircle';
	// import  CircleAlert from 'lucide-svelte/ CircleAlert';
	import {  CircleCheck, CircleX,LoaderCircle, CircleAlert } from 'lucide-svelte';

	let { loading, success, error, polling } = $props();
</script>

{#if loading || polling}
	<section class="col-span-1 md:col-span-3 bg-card rounded-xl p-8 border shadow-sm">
		<div class="text-center">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
				<LoaderCircle class="h-8 w-8 text-primary animate-spin" />
			</div>
			<h2 class="text-xl font-semibold mb-2">
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
	<section class="col-span-1 md:col-span-3 bg-green-50 border-green-200 rounded-xl p-8 border shadow-sm">
		<div class="text-center">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
				<CircleCheck class="h-8 w-8 text-green-600" />
			</div>
			<h2 class="text-xl font-semibold text-green-800 mb-2">Payment Successful!</h2>
			<p class="text-green-700">Your payment has been processed successfully</p>
		</div>
	</section>
{:else if error}
	<section class="col-span-1 md:col-span-3 bg-red-50 border-red-200 rounded-xl p-8 border shadow-sm">
		<div class="text-center">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
				<CircleX class="h-8 w-8 text-red-600" />
			</div>
			<h2 class="text-xl font-semibold text-red-800 mb-2">Payment Failed</h2>
			<p class="text-red-700">{error}</p>
		</div>
	</section>
{:else}
	<!-- Empty state when no status is shown -->
	<section class="col-span-1 bg-card rounded-xl p-6 border shadow-sm">
		<div class="text-center text-muted-foreground">
			<CircleAlert class="h-8 w-8 mx-auto mb-2 opacity-50" />
			<p class="text-sm">Complete the form to proceed with payment</p>
		</div>
	</section>
{/if}
