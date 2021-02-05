<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fly } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
    import { replace, push } from "svelte-spa-router"

    import { Button, notifier } from "smelte";
    import Switch from "smelte/src/components/Switch/Switch.svelte";

    import { PUI } from "./store";

    import axios from "../../system/api";
    import NavBar from "../../components/NavBar.svelte";
    import GroupBox from "../../components/GroupBox.svelte"

    let pui = [];
    let isLoadingPUI = false;
    let isWarnUponDelete:boolean = true;

    let puiUnsub = PUI.subscribe(v => pui = v);

    async function loadPUI() {
        isLoadingPUI = true;
        try {
            let puiResult = (await axios.get("pui/list")).data;
            PUI.set(puiResult.pui);
        } catch (error) {
            notifier.notify("Error while loading list of PUI: " + error.message);
        }
        isLoadingPUI = false;
    }

    function createNewPUI() {
        push("/dashboard/pui/new");
    }

    function formatDelta(timestamp:number, preformat:boolean = false) {
        let [_day, _hour, _minute] = [86400, 3600, 60];

        let [day, hour, minute, seconds] = [0, 0, 0, 0];

        if (timestamp >= _day) {
            let remainder = timestamp % _day;
            let daysInSec = timestamp - remainder;
            day = daysInSec / _day;
            timestamp -= daysInSec;
        }

        if (timestamp >= _hour) {
            let remainder = timestamp % _hour;
            let hoursInSec = timestamp - remainder;
            hour = hoursInSec / _hour;
            timestamp -= hoursInSec;
        }

        if (timestamp >= _minute) {
            let remainder = timestamp % _minute;
            let minsInSec = timestamp - remainder;
            minute = minsInSec / _minute;
            timestamp -= minsInSec;
        }

        seconds = Math.ceil(timestamp);

        if (preformat) {
            return `${day}d, ${hour}h, ${minute}m, ${seconds}s`;
        }

        return { day, hour, minute, seconds }
    }

    function goToPUI(e:MouseEvent) {
        let t:HTMLButtonElement = e.target;
        let parent = t.closest(".pui.p");
        let id = parent.dataset.id;

        push("/dashboard/pui/" + id);
    }

    function deletePUI(e) {
        if (isWarnUponDelete) {
            if (!confirm("Confirm deleting this PUI?")) return;
            if (!confirm("Once you have deleted, this action will not be reversible!")) return;
        }

        let parent = e.target.closest(".pui.p");
        parent.querySelectorAll("button").forEach(e => e.disabled = true);
        let id = parent.dataset.id;

        axios.post("/pui/delete", { id }).then(response => {
            let data = response.data;
            if (data.status == "success") {
                PUI.set(pui.filter(p => p.id != id));
            }
        }).catch(error => {
            window.notify("Error while deleting PUI! " + error.message);
            parent.querySelectorAll("button").forEach(e => e.disabled = false);
        })
    }

    onMount(async () => {
        if (!localStorage["loggedin"] || localStorage["loggedin"] == "false") {
            replace("/");
            return;
        }

        await loadPUI();
    });


    onDestroy(() => {
        puiUnsub();
    })

</script>

<NavBar back={true} title="Manage PUI" backRedirect="/dashboard"/>

<div class="dashboard manage-pui w-screen flex flex-col p-4" style="max-height: 93vh; overflow: hidden auto;">
    {#if !isLoadingPUI}
        <div class="pui-settings">
            <Switch label="Warn Upon Deletion?" bind:value={isWarnUponDelete}/>
        </div>
        <div class="pui-list mt-4 flex-1 overflow-y-auto overflow-x-hidden">
            <div class="pui btn" on:click={createNewPUI}>
                <i class="material-icons">add</i>
                <label>Add PUI</label> 
            </div>
            

            {#if pui && pui.length > 0}
                {#each pui as p, i }
                    <div class="pui p" data-index={i} data-id={p.id}>
                        <label class="name">{p.name}</label>
                        <label class="address info"><i class="material-icons">house</i>{p.address.length <= 38 ? p.address : p.address.substr(0, 35) + "..."}</label>
                        <label class="duration info"><i class="material-icons">access_time</i> {formatDelta(p.delta, true)}</label>
                        <label class="admission info "><i class="material-icons">calendar_today</i> {new Date().toLocaleDateString()}</label>
                        <label class="pin info"><i class="material-icons">vpn_key</i> {p.login_id}</label>

                        <div class="actions flex w-full">
                            <Button color="blue" text flat small add="rounded-none flex-1" on:click={goToPUI}>View</Button>
                            <Button color="error" text flat small add="rounded-none flex-1" on:click={deletePUI}>Delete</Button>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {:else}
        <div class="text-center">Loading...</div>
    {/if}
</div>

<style lang="scss">
    .dashboard {
        .pui-list {
            display: grid;
            justify-items: center;
            grid-template-columns: 1fr;

            .pui {
                max-width: 100%;
                width: 300px;
                min-height: 80px;

                border: 1px solid #ccc;
                border-radius: 0.25em;
                display: flex;
                flex-direction: column;
                align-items: center;
                overflow: hidden;

                margin: 1em;

                &.btn {
                    padding: 1em;
                    cursor: pointer;
                    transition: all 250ms ease-in-out;
                    color: #888;
                    height: fit-content;

                    > label {
                        margin-top: 1em;
                        font-size: 0.875em;
                    }
                
                    &:hover { color: #333; box-shadow: 0 0 8px rgba(81, 157, 219, 0.5); }
                    &:active { background-color: #efefef; color: #333; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3); }
                }

                &.p {
                    
                    .actions {
                        margin-top: 0.5em;
                    }

                    label {
                        &.name {
                            font-size: 1.5rem;
                            font-weight: bolder;
                            padding: 0.5em 0 0.5em 0;
                            color: white;
                            background-color:steelblue;
                            width: 100%;
                            text-align: center;
                        }

                        &.info {
                            color: #888;
                            width: 100%;
                            padding-left: 1rem;
                            display: flex;
                            align-items: center;
                            font-size: 0.85rem;

                            .material-icons {
                                margin-right: 0.5rem;
                                font-size: 1rem;
                            }
                        }

                        &.address {
                            margin-top: 0.5em;
                            margin-bottom: 0.25em;
                        }

                        &.duration {
                            margin-top: 0.25em;
                            margin-bottom: 0.25em;
                        }

                        &.admission {
                            margin-top: 0.25em;
                            margin-bottom: 0.25em;
                        }
                    }
                }

            }
        }
    }

@media only screen and (min-width: 768px) {
    .dashboard {
        .pui-list {
            grid-template-columns: 1fr 1fr 1fr;
        }
    }
}

@media only screen and (min-width: 1000px) {
    .dashboard {
        .pui-list {
            grid-template-columns: 1fr 1fr 1fr 1fr;
        }
    }
}
</style>