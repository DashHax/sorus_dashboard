<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fly } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
    import { replace, push } from "svelte-spa-router"

    import { Button } from "smelte";

    import NavBar from "../../components/NavBar.svelte";
    import GroupBox from "../../components/GroupBox.svelte"

    let name:string = localStorage["user.fullname"] || "No Name";
    
    function navBtnClick(e:MouseEvent) {
        let pageUrl = this.dataset.page;
        push(pageUrl[0] == "/" ? pageUrl : "/" + pageUrl);
    }

    onMount(async () => {
        if (!localStorage["loggedin"] || localStorage["loggedin"] == "false") {
            replace("/");
            return;
        }

        let btns:NodeListOf<HTMLButtonElement> = document.querySelectorAll(".nbtn");
        btns.forEach(btn => {
            btn.addEventListener("click", navBtnClick);
        });
    });

    onDestroy(() => {
        let btns:NodeListOf<HTMLButtonElement> = document.querySelectorAll(".nbtn");
        btns.forEach(btn => {
            btn.removeEventListener("click", navBtnClick);
        });
    })

</script>

<NavBar flat/>

<div class="dashboard home w-screen flex flex-col items-center">
    <div class="header" in:fly={{y: -8, duration: 2000, easing: cubicInOut}}>
        <div class="logo mt-6">
            <div class="logo-icon text-center text-3xl" style="letter-spacing: 8px">SORUS</div>
            <div class="subtext text-center text-sm" style="color: #999;">Home Quarantine Self-Checkin System for PUI</div>
        </div>

        <h5 class="text-center mt-8 mb-2">Hello, {name}!</h5>
    </div>

    <div class="mt-4" in:fly={{y: -8, delay: 250, duration: 2000, easing: cubicInOut}}>
        <GroupBox label="Person Under Investigations" style="width: 768px; max-width: 90vw;">
            <Button color="secondary" add="nbtn" block data-page="dashboard/pui">Manage PUI</Button>
            <Button color="secondary" add="nbtn mt-4" block data-page="dashboard/checkins">Manage Check-In</Button>
        </GroupBox>
    </div>

    <div class="mt-4" in:fly={{y: -8, delay: 500, duration: 2000, easing: cubicInOut}}>
        <GroupBox label="Users" style="width: 768px; max-width: 90vw;">
            <Button color="secondary" add="nbtn" block data-page="dashboard/users/allow">Create Registration Codes</Button>
            <!-- <Button color="secondary" add="nbtn mt-4" block data-page="dashboard/users">Manage Users</Button> -->
        </GroupBox>
    </div>
</div>