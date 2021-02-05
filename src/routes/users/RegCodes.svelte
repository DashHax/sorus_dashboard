<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fly } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
    import { replace, push } from "svelte-spa-router"

    import { Button, TextField } from "smelte";

    import NavBar from "../../components/NavBar.svelte";
    import GroupBox from "../../components/GroupBox.svelte"

    import axios from "../../system/api";

    let newCodeCount:number = null;
    let codes:string[] = [];

    async function loadAllCodes() {
        window.progress(true);
        try {
            let response = await axios.get("/auth/keys/" + localStorage["token"]);
            let result = response.data;

            if (result.status == "success") {
                codes = result.keys;
            } else {
                window.notify("Could not retrieve codes! " + result.error);
            }
        } catch (error) {
            window.notify("Error while retrieving code! " + error.message);
        }
        window.progress(false);
    }

    async function generateCodes() {
        window.progress(true);
        try {
            let payload = {
                token: localStorage["token"],
                count: newCodeCount
            }
            let response = await axios.post("/auth/keys/new", payload);
            let result = response.data;

            if (result.status == "success") {
                codes = [...codes, ...result.keys];
                newCodeCount = null;
            } else {
                window.notify("Could not create codes! " + result.error);
            }
        } catch (error) {
            window.notify("Error while creating code! " + error.message);
        }
        window.progress(false);
    }

    onMount(async () => {
        if (!localStorage["loggedin"] || localStorage["loggedin"] == "false") {
            replace("/");
            return;
        }
        await loadAllCodes();
    });

    onDestroy(() => {
    })

</script>

<NavBar back={true} title="Register Codes" backRedirect="/dashboard"/>

<div class="regcodes w-screen flex flex-col items-center pt-4">
    <GroupBox label="Generate codes">
        <div class="flex flex-col" style="width: 500px; max-width: 90vw;">    
            <TextField label="Number of codes" hint="The number of codes do you want to generate" type="number" bind:value={newCodeCount} />
            <div class="my-2"></div>
            <Button flat color="primary" on:click={generateCodes}>Generate</Button>
        </div>
    </GroupBox>
    <br />

    <GroupBox label="Registration codes">
        <div class="flex flex-col" style="width: 768px; max-width: 90vw; max-height: 50vh; overflow: hidden auto;">
            {#if codes && codes.length > 0}
                {#each codes as code}
                    <p class="mt-4">{code}</p>
                {/each}
            {:else}
                <p class="text-center p-4" style="color: #888">No codes yet...</p>
            {/if}
        </div>
    </GroupBox>
</div>