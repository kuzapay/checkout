<script lang="ts">
	// import Store from 'lucide-svelte/Store';
	// import Globe from 'lucide-svelte/Globe';
	import { Store, Globe } from 'lucide-svelte';

	let { checkoutTitle, posterImage, username } = $props();
</script>

<svelte:head>
	{#if posterImage}
		<link rel="icon" type="image/x-icon" href={posterImage} />
	{/if}
</svelte:head>

<header class="col-span-1 rounded-xl border bg-card p-6 shadow-sm md:col-span-2">
	<div class="flex items-center gap-4">
		{#if posterImage}
			<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
				<img src={posterImage} alt="Store logo" class="h-full w-full object-cover" />
			</div>
		{:else}
			<div class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
				<Store class="text-muted-foreground h-8 w-8" />
			</div>
		{/if}

		<div class="flex-1">
			<h1 class="mb-1 text-2xl font-bold text-foreground">{checkoutTitle || 'Checkout'}</h1>
			{#if username}
				<div class="text-muted-foreground flex items-center gap-1 text-sm">
					<Globe class="h-4 w-4" />
					<span>Powered by {username}</span>
				</div>
			{/if}
		</div>
	</div>
</header>
