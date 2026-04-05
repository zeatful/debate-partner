<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();

	let isDark = $state(true);

	onMount(() => {
		const saved = localStorage.getItem('theme');
		isDark = saved !== 'light';
		applyTheme(isDark);
	});

	function applyTheme(dark: boolean) {
		if (dark) {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', 'light');
		}
	}

	function toggleTheme() {
		isDark = !isDark;
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		applyTheme(isDark);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Apply theme before first paint to prevent flash of wrong theme -->
	<!-- eslint-disable-next-line svelte/no-inner-declarations -->
	{@html `<script>(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();</script>`}
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=IBM+Plex+Mono:wght@400;500&display=swap"
		rel="stylesheet"
	/>
	<title>Debate Partner</title>
</svelte:head>

<div class="min-h-screen">
	<!-- Theme toggle — fixed top right -->
	<button
		type="button"
		onclick={toggleTheme}
		aria-label="Toggle theme"
		style="
			position: fixed;
			top: 1rem;
			right: 1rem;
			z-index: 100;
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(var(--ink), 0.05);
			border: 1px solid rgba(var(--ink), 0.10);
			border-radius: 4px;
			cursor: pointer;
			transition: background 0.15s, border-color 0.15s;
			color: rgba(var(--ink), 0.55);
		"
		onmouseenter={(e) => {
			const t = e.currentTarget as HTMLButtonElement;
			t.style.setProperty('background', 'rgba(var(--ink), 0.1)');
			t.style.setProperty('color', 'rgba(var(--ink), 0.85)');
		}}
		onmouseleave={(e) => {
			const t = e.currentTarget as HTMLButtonElement;
			t.style.setProperty('background', 'rgba(var(--ink), 0.05)');
			t.style.setProperty('color', 'rgba(var(--ink), 0.55)');
		}}
	>
		{#if isDark}
			<!-- Sun icon -->
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="4"/>
				<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
			</svg>
		{:else}
			<!-- Moon icon -->
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
			</svg>
		{/if}
	</button>

	{@render children()}
</div>
