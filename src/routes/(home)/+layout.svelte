<script lang="ts">
	import '../layout.css';
	import favicon from '$lib/assets/favicon.webp';

	let { children } = $props();
	let isOpen = $state(true);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>
