<script lang="ts">
    export let location:any = { radius: 20, latitude: 0, longitude: 0 };

    import { onMount, onDestroy, tick } from "svelte";
    import { LeafletMap, TileLayer, Circle, Popup, Tooltip } from "svelte-leafletjs";

    import TextField from "smelte/src/components/TextField/TextField.svelte";
    import Button from "smelte/src/components/Button/Button.svelte";
    import Slider from "smelte/src/components/Slider/Slider.svelte";
    import List from "smelte/src/components/List/List.svelte";

    import { searchFreetext } from "../../services/geo.service";

    let geosearchTerm:string = null;
    let geosearchTimer = null;
    let geosearchResult = [];
    let geosearchList = [];
    let geosearchSelectedIndex = null;

    let showCircle:boolean = false;

    let leafletMap;
    
    let mapOptions = {
        center: [1.364917, 103.822872],
        zoom: 11,
    };
    const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileLayerOptions = {
        minZoom: 0,
        maxZoom: 20,
        maxNativeZoom: 19,
        attribution: "© OpenStreetMap contributors",
    };

    function performGeosearch() {
        if (!geosearchTerm || geosearchTerm.length == 0) return;

        if (geosearchTimer) clearInterval(geosearchTimer);

        geosearchTimer = setTimeout(async () => {
            try {
                let search = await searchFreetext(geosearchTerm);
                geosearchResult = search.data;
                geosearchList = geosearchResult.map((x, i) => { return { value: i.toString(), text: x.label } });
            } catch (error) {
                window.notify("Cannot search location! " + error.message);
                console.log(error);
            }
        }, 300);
    }

    function geosearchSelected() {
        showCircle = false;
        try {    
            geosearchList = [];
            let selectedIndex = parseInt(geosearchSelectedIndex);
            let geo = geosearchResult[selectedIndex];
            let map = leafletMap.getMap();

            location.latitude = geo.latitude;
            location.longitude = geo.longitude;

            geosearchTerm = geo.label;
            map.flyTo([geo.latitude, geo.longitude], map.getZoom());
        } catch (error) {
            window.notify("Something wrong happened... Try again.");
        }
    }

    onMount(async () => {
        await tick();
        let map = leafletMap.getMap();
        map.on("click", function (e) {
            let { lat, lng } = e.latlng;
            location.latitude = lat;
            location.longitude = lng;

            showCircle = true;

            console.log(e.latlng);
        })
    })
</script>

<div class="location-editor">
    <TextField label="Search location" on:input={performGeosearch} bind:value={geosearchTerm}/>
    {#if geosearchResult.length > 0 && geosearchList.length > 0}
        <div class="search-result">
            <List items={geosearchList} on:change={geosearchSelected} bind:value={geosearchSelectedIndex}/>
        </div>
    {/if}

    <div class="map-area mt-4">
        <div id="map" class="mb-4">
            <LeafletMap bind:this={leafletMap} options={mapOptions}>
                <TileLayer url={tileUrl} options={tileLayerOptions}/>
                {#if showCircle}
                    <Circle latLng={[location.latitude, location.longitude]} radius={location.radius} color="#ff0000" fillColor="#ff0000">
                        <Popup>Quarantine Zone</Popup>
                        <Tooltip>Quarantine Zone</Tooltip>
                    </Circle>
                {/if}
            </LeafletMap>
        </div>
        <Slider label="Distance radius ({location.radius} m)" min={30} max={1000} bind:value={location.radius}/>
    </div>

</div>

<style lang="scss">
    .location-editor {
        width: 768px;
        max-width: 90vw;
        position: relative;

        .search-result {
            position: absolute;
            z-index: 10000;
            background-color: white;
            width: 100%;
            transform: translateY(-1.4em);
            left: 0;
            overflow: hidden auto;
            height: 200px;
            box-shadow: 0 0 8px rgba(0,0,0, 0.28);
        }

        .map-area {
            
            #map {
                height: 500px;
            }
        }
    }
</style>