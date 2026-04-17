<script lang="ts">
    import {Crown,Tag} from 'lucide-svelte';

	// Ensure props have default values
	let { 
		hasTiers = false, 
		tiers = [], 
		customAmount = '', 
		selectedTier = null, 
		onTierSelect = null, 
		onAmountChange = null
	} = $props();

	function handleTierClick(tierId: string) {
		if (onTierSelect) {
			onTierSelect(tierId);
		}
	}

	function handleCustomAmountChange(event: Event) {
		if (onAmountChange) {
			onAmountChange((event.target as HTMLInputElement).value);
		}
	}
</script>


<section class="mb-6">
	{#if hasTiers && tiers && Array.isArray(tiers) && tiers.length > 0}
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Choose a tier</h2>
	{:else if customAmount || !hasTiers}
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Enter an Amount</h2>
	{:else}
		<!-- No header if fixed amount -->
	{/if}

	{#if hasTiers && tiers && Array.isArray(tiers) && tiers.length > 0}
		<div class="space-y-3">
			{#each tiers.filter(tier => tier && tier.id && tier.label && tier.amount).sort((a, b) => Number(a.amount) - Number(b.amount)) as tier (tier.id)}
				<button
					type="button"
					class="w-full p-4 rounded-xl border-2 transition-all shadow-sm {selectedTier === tier.id || (tier.tier && `tier-${tier.tier}` === selectedTier) ? 'border-accent bg-accent/5 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'}"
					onclick={() => handleTierClick(tier.id || `tier-${tier.tier}`)}
				>
					<div class="flex items-center justify-between">
						<div class="text-left">
							<h3 class="font-semibold text-gray-900">{tier.label}</h3>
							{#if tier.description}
								<p class="text-sm text-gray-600 mt-1">{tier.description}</p>
							{/if}
						</div>
						<div class="text-right">
							<div class="text-2xl font-semibold text-gray-900">KES {tier.amount}</div>
						</div>
					</div>
					
					{#if selectedTier === tier.id || (tier.tier && `tier-${tier.tier}` === selectedTier)}
						<div class="absolute top-4 right-4">
							<div class="h-5 w-5 rounded-full bg-accent flex items-center justify-center">
								<svg class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							</div>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	{:else}
		<div class="space-y-4">
			<!-- Suggested Amount Buttons -->
			<div>
				<div class="block text-sm font-medium text-gray-700 mb-3">Suggested amount</div>
				<div class="grid grid-cols-3 gap-3" role="group" aria-label="Suggested amounts">
					<button
						type="button"
						class="py-3 px-4 border border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md text-slate-900 font-medium"
						onclick={() => onAmountChange && onAmountChange('500')}
					>
						KES 500
					</button>
					<button
						type="button"
						class="py-3 px-4 border border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md text-slate-900 font-medium"
						onclick={() => onAmountChange && onAmountChange('1000')}
					>
						KES 1,000
					</button>
					<button
						type="button"
						class="py-3 px-4 border border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md text-slate-900 font-medium"
						onclick={() => onAmountChange && onAmountChange('2000')}
					>
						KES 2,000
					</button>
				</div>
			</div>
			
			<!-- Custom Amount Input -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2" for="amount-input">
					Enter any amount <span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
					<input
						id="amount-input"
						type="number"
						placeholder="0.00"
						min="0"
						value={customAmount}
						oninput={handleCustomAmountChange}
						class="w-full pl-12 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-slate-900 placeholder-slate-400 shadow-sm focus:shadow-md transition-all"
					/>
				</div>
			</div>
		</div>
	{/if}
</section>
