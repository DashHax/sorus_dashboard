<script lang="ts">
	import "smelte/src/tailwind.css";
	import "leaflet/dist/leaflet.css";
	
	import { Notifications, notifier, ProgressCircular } from "smelte";
	import Router from "svelte-spa-router"

	import routes from "./routes";
	import { init } from "./system/ai";
	import { fade } from "svelte/transition";

	let progressVisible:boolean = false;

	window.notify = function (msg) {
		notifier.notify(msg);
	}

	window.progress = function (state:boolean) {
		progressVisible = !(!state);
	}

	init().then(e => console.log("AI initialized!")).catch(err => console.log("Error initializing AI: ", err));
</script>

<Router {routes} />
<Notifications />

{#if progressVisible}
	<div class="progress-screen" transition:fade|local>
		<div class="circle">
			<ProgressCircular color="blue" width={3}/>
		</div>
	</div>
{/if}

<style lang="scss" global>
	* {
		padding: 0;
		margin: 0;
		font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	body {
		margin: 0;
		padding: 0;
		background-color: white;
	}

	.gray-333 { color: #333; }

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: fit-content;

		&.fill { width: 100%; }
	
		.material-icons {
			margin-right: 0.5em;
		}

		&.small {
			font-size: 0.85em;
		}
	}

	.progress-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;

		background-color: rgba(0, 0, 0, 0.4);
		z-index: 99999999999;

		.circle {
			padding: 1em;
			border-radius: 100%;
			background-color: rgba(0, 0, 0, 0.9);
		}
	}
</style>