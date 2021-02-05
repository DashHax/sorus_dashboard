<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fly } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
    import { replace, push } from "svelte-spa-router"

    import { Button, TextField } from "smelte";
    import Switch from "smelte/src/components/Switch/Switch.svelte";

    import NavBar from "../../components/NavBar.svelte";
    import GroupBox from "../../components/GroupBox.svelte"
    
    import axios from "../../system/api";

    type Checkin = {
        name: string,
        checked_time: string,
        lat: number,
        long: number,
        bounded: boolean
    }

    let checkins:Checkin[] = [];
    let invalidOnly:boolean = false;

    async function listCheckins() {
        checkins = [];
        window.progress(true);
        try {
            let payload = {
                token: localStorage["token"],
                invalidOnly
            }
            let resp = await axios.post("/checkin/list", payload);
            let res = resp.data;

            if (res.status == "success") {
                checkins = res.checkins;
            } else {
                window.notify("Something wrong while loading. " + res.error);
            }
        } catch (error) {
            window.notify("Error while loading check-in transactions! " + error.message);
        }
        window.progress(false);
    }

    function performReport() {
        if (!confirm("Do you want to report this PUI to local law enforcer?")) return;
        if (!confirm("Such actions may not be reversible, and performing false report could be charged for fraud.")) return;

        window.notify("[MOCK] Sending report...");
        setTimeout(() => window.notify("[MOCK] PUI had been reported!"), 3500);
    }

    onMount(async () => {
        await listCheckins();
    })
</script>

<NavBar back={true} title="Manage Check-Ins" backRedirect="/dashboard"/>

<div class="checkins mt-4 p-4">
    <GroupBox label="Filters">
        <div class="filters">
            <Switch label="Show out of bound check-ins" bind:value={invalidOnly}/>
            
        </div>
        <div class="btns mt-2">
            <Button flat on:click={listCheckins}>Apply</Button>
        </div>
    </GroupBox>

    <div class="list mt-4">
        {#if checkins && checkins.length > 0}
            {#each checkins as rec}
                <div class="record">
                    <div class="informations">
                        <label class="text-xl mb-2">{rec.name}</label>
                        <div class="info">
                            <i class="material-icons">calendar_today</i> {new Date(rec.checked_time).toLocaleString()}
                        </div>
                        <div class="info"><i class="material-icons">location_on</i> {rec.lat.toFixed(8)}, {rec.long.toFixed(8)} 
                            <span class="mx-2"></span><Button small flat target="_blank" href="https://www.google.com/maps/place/{rec.lat},{rec.long}&zoom=35">View on Maps</Button></div>

                        <div class="info">
                            Valid: <strong><span class="ml-2" style="color: {rec.bounded ? "green" : "#DD0000"};">{rec.bounded ? "Yes" : "No (checked-in at outside specified region)"}</span></strong>
                        </div>
                    </div>
                    <div class="btns">
                        {#if rec.bounded == false}                        
                            <Button color="error" flat title="Report" on:click={performReport}><i class="material-icons" style="padding: 0; margin: 0;">report</i></Button>
                        {/if}
                    </div>
                </div>
            {/each}
        {:else}
            <label class="text-center p-4" style="color: #888">No check-in records...</label>
        {/if}
    </div>
</div>

<style lang="scss">
    .checkins {
        display: flex;
        flex-direction: column;
        align-items: center;

        .filters {
            padding: 1em;
            display: flex;
            width: 768px;
            max-width: 90vw;
        }

        .list {
            flex: 1;
            border: 1px solid #ccc;
            overflow: hidden auto;
            display: flex;
            flex-direction: column;

            width: 768px;
            max-width: 90vw;
            max-height: 85vh;

            .record {
                display: flex;

                border-bottom: 1px solid #ccc;

                .informations {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 1em;
                    
                    .info {
                        display: flex;
                        color: #333;
                        align-items: center;

                        &:not(:first-child) {
                            margin-top: 0.5rem;
                        }

                        .material-icons {
                            font-size: 1em;
                            color: #888;
                            margin-right: 0.5rem;
                        }
                    }
                }

                .btns {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 1em;
                }
            }
        }
    }
</style>