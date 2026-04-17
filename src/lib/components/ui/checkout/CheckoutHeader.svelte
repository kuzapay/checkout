<script lang="ts">
	// import Store from 'lucide-svelte/Store';
	// import Globe from 'lucide-svelte/Globe';
	import {Store,Globe} from 'lucide-svelte';

	let { checkoutTitle, posterImage, username } = $props();
</script>

<svelte:head>
	{#if posterImage}
		<link rel="icon" type="image/x-icon" href={posterImage} />
	{/if}
</svelte:head>

<header class="col-span-1 md:col-span-2 bg-card rounded-xl p-6 border shadow-sm">
	<div class="flex items-center gap-4">
		{#if posterImage}
			<div class="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
				<img src={posterImage} alt="Store logo" class="h-full w-full object-cover" />
			</div>
		{:else}
			<div class="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
				<Store class="h-8 w-8 text-muted-foreground" />
			</div>
		{/if}
		
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-foreground mb-1">{checkoutTitle || 'Checkout'}</h1>
			{#if username}
				<div class="flex items-center gap-1 text-sm text-muted-foreground">
					<Globe class="h-4 w-4" />
					<span>Powered by {username}</span>
				</div>
			{/if}
		</div>
	</div>
</header>
