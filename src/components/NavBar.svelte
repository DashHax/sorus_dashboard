<script lang="ts">
    export let back:boolean = false;
    export let next:boolean = false;
    export let logout:boolean = true;

    export let title:string = null;

    export let leftButtons = [];
    export let rightButtons = [];
    export let midButtons = [];

    export let flat:boolean = false;

    export let backRedirect:string = null;
    export let nextRedirect:string = null;

    export let fixed:boolean = false;

    import { replace, pop } from "svelte-spa-router";
    import { fade } from "svelte/transition"
    import {Button} from "smelte"

    import { logout as AuthLogout } from "../system/auth";

    function performLogout(e:MouseEvent) {
        AuthLogout();
        replace("/");
    }

    function backAction(e:MouseEvent) {
        if (backRedirect) replace(backRedirect)
        else pop();
    }

    function nextAction(e:MouseEvent) {
        if (nextRedirect) replace(nextRedirect);
    }
</script>

<div class="navbar" class:flat class:fixed>
    <div class="left-btns btns" in:fade>
        {#if back}
            <Button text flat color="secondary" on:click={backAction}><span class="material-icons">chevron_left</span></Button>
        {/if}
        {#if next}
            <Button text flat color="secondary" on:click={nextAction}><span class="material-icons">chevron_right </span></Button>
        {/if}
        {#if leftButtons && leftButtons.length > 0}
            {#each leftButtons as btn, i}
                <Button flat text={btn.text} color={ btn.color || "secondary" } on:click={btn.onClick} title={btn.tooltip}>{@html btn.content}</Button>
            {/each}
        {/if}
    </div>

    {#if title}
        <label in:fade class="ml-2 uppercase" style="color: #555; font-size: 1.125em;">{title}</label>
    {/if}
 
    <div class="mid-btns btns" in:fade>
        {#if midButtons && midButtons.length > 0}
            {#each midButtons as btn, i}
                <Button flat text={btn.text} color={ btn.color || "secondary" } on:click={btn.onClick} title={btn.tooltip}>{@html btn.content}</Button>
            {/each}
        {/if}
    </div>
    <div class="right-btns btns" in:fade>
        {#if rightButtons && rightButtons.length > 0}
            {#each rightButtons as btn, i}
                <Button flat text={btn.text} color={ btn.color || "secondary" } on:click={btn.onClick} title={btn.tooltip}>{@html btn.content}</Button>
            {/each}
        {/if}

        {#if logout}        
            <Button title="Logout" icon="power_settings_new" color="secondary" text light flat on:click={performLogout}></Button>
        {/if}
    </div>
</div>

{#if fixed}
    <div class="fixed-spacer">

    </div>
{/if}

<style lang="scss">
    .fixed-spacer {
        height: 50px;
    }

    .navbar {
        height: 50px;
        background-color: white;
        box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.28);

        display: flex;
        align-items: center;

        &.flat {
            background-color: transparent;
            box-shadow: none;
        }

        &.fixed {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;

            z-index: 10;
        }

        .btns {
            display: flex;

            &.mid-btns {
                flex: 1;
            }

            &.right-btns {
                margin-right: 0.25em;
            }
        }
    }
</style>