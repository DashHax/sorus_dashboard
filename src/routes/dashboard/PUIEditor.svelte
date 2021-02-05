<script lang="ts">
    type PUIEditorParameters = {
        puiID: string
    } 

    export let params:PUIEditorParameters;
    
    let isUpdate = params && params.puiID
    import { onMount, tick } from "svelte";
    import { fade } from "svelte/transition";

    import Button from "smelte/src/components/Button/Button.svelte";
    import TextField from "smelte/src/components/TextField/TextField.svelte";
    import Switch from "smelte/src/components/Switch/Switch.svelte";
    import Dialog from "smelte/src/components/Dialog/Dialog.svelte";
    import ProgressCircular from "smelte/src/components/ProgressCircular/ProgressCircular.svelte";
    import DatePicker from "smelte/src/components/DatePicker/DatePicker.svelte";

    import axios from "../../system/api";
    import { countries as rawCountries } from "../../system/constants";

    import NavBar from "../../components/NavBar.svelte";
    import GroupBox from "../../components/GroupBox.svelte";

    import FaceExtractor from "./FaceExtractor.svelte";
    import LocationEditor from "./LocationEditor.svelte";
    import { replace } from "svelte-spa-router";

    let progressVisible:boolean = false;
    
    let nationalityWindowVisible:boolean = false;
    let nationalityTerm:string = null;

    let searchCounter = null;
    let searchResult = [];
    let selectedSearchNationality = null;

    let locationWindowVisible:boolean = false;

    let capturedFaces = [];
    let editedLocation:any = {};

    let responseLoginID = null;

    let actionButtons = [
        { content: `<div class="action-btn"><i class="material-icons">check</i> Save</div>`, onClick: savePUI }
    ]

    let countries = {};
    rawCountries.forEach(item => {
        let key = item.code, value = item.name;
        if (countries[key])
            key = key + "." + (Object.keys(countries).filter(x => x.indexOf(key) > -1).length + 1).toString();
        
        countries[key] = value;
    });

    let blankPUI = () => {
        return {
            fullname: null,
            icno: null,
            contactno: null,
            local: true,
            nationality: "MY",
            locationName: null,
            locationAddress: null,
            locationLatitude: null,
            locationLongitude: null,
            locationRadius: null,
            admitDate: new Date().toISOString(),
            admitDuration: 14,
            faces: []
        };
    }

    let puiObj = blankPUI();

    async function savePUI() {
        progressVisible = true;

        try {
            
            let payload = Object.assign({}, puiObj);
            payload.faces = capturedFaces.map(item => item.embedding);

            let url = isUpdate ? "/pui/update/" + params.puiID : "/pui/new"
            let response = (await axios.post(url, payload)).data;
            if (response.status == "success") {
                window.notify("PUI Transaction successful!");

                if (!isUpdate) {
                    puiObj = blankPUI();
                    capturedFaces = [];
                    responseLoginID = response.pin;
                }
            } else {
                window.notify("Something wrong occured while performing PUI transaction! " + response.error);
            }
        } catch (error) {
            window.notify("An error occured while performing PUI transaction! " + error.message);
            console.log(error);
        }
        
        progressVisible = false;
    }

    async function deletePUI() {
        if (!confirm(`Confirm deleting "${puiObj.fullname}" from registered PUI!`)) return;
        if (!confirm("Such action is not reversible!")) return;

        try {
            let id = params.puiID;
            let response = (await axios.post("/pui/delete", { id })).data;

            if (response.status == "success") {
                replace("/dashboard/pui");
                window.notify(`${puiObj.fullname} successfully had been removed!`);
            }
            
        } catch (error) {
            window.notify("An error occured while deleting PUI! " + error.message);
            console.log(error);
        }
        progressVisible = false;
    }

    function searchCountry(e) {
        if (searchCounter)
            clearTimeout(searchCounter);

        searchCounter = setTimeout(() => {
            console.log(nationalityTerm);
            searchResult = rawCountries.filter(country => country.name.toLowerCase().indexOf(nationalityTerm.toLowerCase()) > -1);
        }, 500);
    }

    function selectNationality(e) {
        if (!selectedSearchNationality && searchResult.length > 0)
            selectedSearchNationality = searchResult[0].code;
        
        puiObj.nationality = selectedSearchNationality || "MY";
        console.log(selectedSearchNationality, puiObj);
        nationalityWindowVisible = false;
    }

    function showLocationMap() {
        locationWindowVisible = true;
    }

    function selectLocationInfo() {
        locationWindowVisible = false;
        puiObj.locationLatitude = editedLocation.latitude;
        puiObj.locationLongitude = editedLocation.longitude;
        puiObj.locationRadius = editedLocation.radius;
    }

    $: {
        if (puiObj.local) {
            console.log("Changed to MY");
            puiObj.nationality = "MY";
        }
    }

    if (isUpdate) {   
        actionButtons = [{ color: "error", content: `<div class="action-btn"><i class="material-icons">delete</i>Delete</div>`, onClick: deletePUI }, ...actionButtons];
    }

    onMount(() => {
        if (isUpdate) {
            let id = params.puiID;
            progressVisible = true;
            axios.get("/pui/view/" + id).then(response => {
                let data = response.data;

                if (data.status == "success") {
                    puiObj = data.pui;
                } else {
                    window.notify("Something is wrong while loading PUI! " + data.error);
                }
                progressVisible = false;
            }).catch(err => {
                window.notify("Fatal error while loading PUI! " + err.message);
                progressVisible = false;
            })
        }
    })

    console.log(params, countries, rawCountries.length, Object.keys(countries).length);
</script>

<NavBar logout={false} back={true} rightButtons={actionButtons} backRedirect="/dashboard/pui" fixed/>
<div class="pui-editor">
    <div class="personal-info md:flex-1">
        <GroupBox label="Personal Information">
            <div class="p-4">
                <TextField label="Full name" bind:value={puiObj.fullname}/>
                <TextField label="Identity Card/Passport Number" bind:value={puiObj.icno}/>
                <TextField label="Contact Number" hint="Including the country code (+60 for Malaysia) (i.e.: +60123456789)" bind:value={puiObj.contactno} />
                <Switch label="Is this a local PUI?" bind:value={puiObj.local} />
                <Button disabled={puiObj.local} block flat type="button" add="mt-4" on:click={(e) => nationalityWindowVisible = true}>Nationality: {countries[puiObj.nationality]}</Button>
            </div>
        </GroupBox>

        <GroupBox label="Geofencing Information">
            <div class="p-4">
                <TextField label="Address Name" bind:value={puiObj.locationName}/>

                <TextField add="resize-none" textarea rows="2" label="Full Address" bind:value={puiObj.locationAddress}/>

                <div class="coordinate-box">
                    <TextField label="Latitude" bind:value={puiObj.locationLatitude}/>
                    <TextField label="Longitude" bind:value={puiObj.locationLongitude}/>
                    <TextField label="Radius (m)" hint="The allowed circular radius in meter." bind:value={puiObj.locationRadius}/>
                </div>
                <Button color="blue" block on:click={showLocationMap}>Show Map</Button>
            </div>
        </GroupBox>
    </div>
    <div class="face-identity md:flex-1">
        <GroupBox label="Face Data">
            <FaceExtractor bind:faces={capturedFaces}/>
        </GroupBox>
        <GroupBox label="Admission Information">
            <DatePicker label="Admission Date" value={new Date(puiObj.admitDate)} on:change={e => puiObj.admitDate = e.detail.toISOString()}/>
            <TextField label="Duration (days)" bind:value={puiObj.admitDuration} type="number" />
        </GroupBox>

        {#if isUpdate || !(!responseLoginID)}
            <GroupBox label="Login PIN">
                <h4 class="m-4 text-center">{puiObj.loginID || responseLoginID}</h4>
            </GroupBox>
        {/if}
    </div>
</div>

<Dialog bind:value={nationalityWindowVisible} persistent={true}>
    <h6 slot="title">Select Nationality</h6>
    <div class="nationality-selection">
        <TextField label="Nationality" hint="You can also select from below" on:input={searchCountry} bind:value={nationalityTerm} />

        <div class="search-result mt-4">
            {#if searchResult.length > 0}
                <select class="w-full p-4" bind:value={selectedSearchNationality}>
                    {#each searchResult as res, i}
                        <option selected={i == 0} value={res.code}>{res.name}</option>
                    {/each}
                </select>
            {:else}
                <label class="text-center w-full p-4 text-sm" style="color: #666">No country found...</label>
            {/if}
        </div>
    </div>
    <div slot="actions">
        <Button flat color="secondary" on:click={selectNationality}>Select</Button>
        <Button text color="alert" on:click={() => nationalityWindowVisible = false}>Close</Button>
    </div>
</Dialog>

<Dialog bind:value={locationWindowVisible}>
    <h6 slot="title">Select Location:</h6>
    <LocationEditor bind:location={editedLocation}/>
    <div slot="actions">
        <Button flat color="secondary" on:click={selectLocationInfo}>OK</Button>
        <Button text color="alert" on:click={() => locationWindowVisible = false}>Cancel</Button>
    </div>
</Dialog>

{#if progressVisible}
<div class="preloader" transition:fade|local>
    <ProgressCircular color="secondary" width={3}/>
</div>
{/if}

<style lang="scss">
    .pui-editor {
        padding: 1em;
        display: flex;
    }

    .nationality-selection {
        width: 400px;
        max-width: 90vw;
        max-height: 75vh;
        overflow: hidden auto;
    }

    .preloader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 99999999;
        background-color: rgba(0, 0, 0, 0.5);

        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    :global(.coordinate-box) {
        display: flex;
    }

    :global(.coordinate-box > div) {
        flex: 1;
    }

@media only screen and (max-width: 768px) {
    .pui-editor {
        flex-direction: column;
    }
}

@media only screen and (min-width: 769px) {
    .pui-editor {
        flex-direction: row;
    }
}
</style>