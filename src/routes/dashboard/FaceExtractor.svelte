<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";    
    import { fly } from "svelte/transition";

    import { FACE_LIMIT } from "../../system/constants";
    import { faceDetectionModel, faceRecognitionModel, modelLoaded, getTensor } from "../../system/ai";

    import Button from "smelte/src/components/Button/Button.svelte";
    import Select from "smelte/src/components/Select/Select.svelte";
    import Slider from "smelte/src/components/Slider/Slider.svelte";
    import TextField from "smelte/src/components/TextField/TextField.svelte";
    import ProgressCircular from "smelte/src/components/ProgressCircular/ProgressCircular.svelte";

    import GroupBox from "../../components/GroupBox.svelte";

    let progressCamera:boolean = false;
    let devices:MediaDeviceInfo[] = null;
    let deviceList = [];
    let selectedDevice = null;
    let videoStream:MediaStream = null;
    let videoElement:HTMLVideoElement = null;
    let canvasDisplay:HTMLCanvasElement = null;

    let settingsVisible:boolean = false;

    let pad = {l: 0, r: 0, t: 0, b: 0}
    let cropName:string = null;

    let selectedCropKey:string = null;
    let cropperSettings = [];

    export let faces = [];

    async function loadDevices() {
        let mediaDevies:MediaDevices = navigator.mediaDevices;
        devices = (await mediaDevies.enumerateDevices()).filter(item => item.kind == "videoinput");
        deviceList = devices.map((item, i) => { return { value: item.deviceId, text: item.label || item.groupId || `Camera ${i + 1}`} })
    }

    async function startCamera(deviceID:string) {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }

        let mediaDevies:MediaDevices = navigator.mediaDevices;
        videoStream = await mediaDevies.getUserMedia({ video: { deviceId: deviceID } });
        videoElement.srcObject = videoStream;
    }

    function selectAndStartCamera() {
        localStorage["cameraDevice"] = selectedDevice;
        startCamera(selectedDevice);
    }

    function loadCropperSettings() {
        cropperSettings = [];
        let cropperConfigsKeys = Object.keys(localStorage).filter(item => item.indexOf("crop.") == 0);
        for (let cropperKey of cropperConfigsKeys) {
            let text = cropperKey.replace("crop.", "");
            let value = cropperKey;
            cropperSettings = [{ text, value }, ...cropperSettings];
        }
    }

    function obtainFace(x: number, y: number, w: number, h: number) {
        let { l, r:rp, t, b:bp } = pad;
        
        console.time("draw face");
        let canvas:HTMLCanvasElement = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;

        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, 224, 224);
        ctx.drawImage(videoElement, x + l, y + t, w - rp, h - bp, 0, 0, 224, 224);
        console.timeEnd("draw face");

        console.time("face url");
        let imageURL = canvas.toDataURL("image/jpg", 0.9);
        console.timeEnd("face url");
        
        console.time("face data");
        let imageData = ctx.getImageData(0, 0, 224, 224);
        console.timeEnd("face data");

        console.time("infer face");
        let input = getTensor(imageData);
        let embedding = (faceRecognitionModel.predict(input)).dataSync();
        embedding = Array.from(embedding)
        console.timeEnd("infer face");

        faces = [{ imageURL, imageData, embedding }, ...faces];
        if (faces.length > FACE_LIMIT) {
            faces = faces.slice(0, FACE_LIMIT);
        }
    }

    async function snapFace() {
        if ($modelLoaded) {
            progressCamera = true;

            try {
                console.time("get faces");
                let result = await faceDetectionModel.estimateFaces({ input: videoElement });
                console.timeEnd("get faces");

                console.time("get bb");
                let bb = result[0].boundingBox;
                let x = bb.topLeft[0],
                    y = bb.topLeft[1],
                    r = bb.bottomRight[0],
                    b = bb.bottomRight[1],
                    w = r - x,
                    h = b - y;
                console.timeEnd("get bb");

                obtainFace(x, y, w, h);
            } catch (err) {
                console.log(err);
                window.notify("Error while snapping face! " + err.message);
            }
            progressCamera = false;
        } else {
            window.notify("Model not loaded!");
        }
    }

    function showCameraSettings() {
        settingsVisible = !settingsVisible;
    }

    function saveCropSettings() {
        if (!cropName) {
            let count = Object.keys(localStorage).filter(e => e.indexOf("crop.") == 0).length + 1;
            cropName = "Crop " + count;
        }

        localStorage[`crop.${cropName}`] = JSON.stringify(pad);
        cropName = null;
        loadCropperSettings();
    }

    function setDefaultCrop() {
        if (!cropName && cropperSettings.length == 0) return;
        if (!cropName) {
            localStorage["defaultCrop"] = cropperSettings[0].value;
        } else {
            let cropKey = `crop.${cropName}`;
            if (!localStorage[cropKey])
                saveCropSettings();
            localStorage["defaultCrop"] = cropKey;
        }
    }

    function cropPresetsChanged() {
        console.log(selectedCropKey);
        cropName = selectedCropKey.replace("crop.", "");
        pad = JSON.parse(localStorage[selectedCropKey]);
    }

    function loadCropPresets() {
        if (!localStorage["defaultCrop"]) return;
        let defaultCrop = localStorage["defaultCrop"];
        if (!localStorage[defaultCrop]) return;
        selectedCropKey = defaultCrop;
        cropPresetsChanged();
    }

    function deleteFace(e) {
        let t = e.target;
        let face = t.closest(".face");
        let index = face.dataset.index;
        index = parseInt(index);

        faces = faces.filter((_, idx) => idx != index);

        console.log("Delete " + index);
    }

    onMount(async () => {
        await loadDevices();
        await tick();
        loadCropperSettings();
        loadCropPresets();
        if (localStorage["cameraDevice"]) {
            selectedDevice = localStorage["cameraDevice"];
            selectAndStartCamera();
        } else {
            startCamera(null);
        }
    });

    onDestroy(() => {
        if (videoStream)
            videoStream.getTracks().forEach(track => track.stop());
    })
</script>

<div class="face-extractor">
    <Select items={deviceList} bind:value={selectedDevice} on:change={selectAndStartCamera}/>
    <div class="camera">
        <video bind:this={videoElement} autoplay playsinline></video>
        <div class="btns">
            <Button icon="camera" color="secondary" on:click={snapFace}></Button>
            <Button icon="settings" color="gray" on:click={showCameraSettings}></Button>
        </div>
        {#if settingsVisible}
            <div class="settings" transition:fly|local={{y: -8}}>
                <GroupBox label="Crop Padding" classes="bg-white">
                    <Slider label="Left" min={-224} max={224} bind:value={pad.l} />
                    <Slider label="Top" min={-224} max={224} bind:value={pad.t} />
                    <Slider label="Right" min={-224} max={224} bind:value={pad.r} />
                    <Slider label="Bottom" min={-224} max={224} bind:value={pad.b} />
                    <div class="save-area">
                        <TextField label="Settings Name" bind:value={cropName} />
                        <Button flat on:click={saveCropSettings}>Save Preset</Button>
                        <Button flat on:click={setDefaultCrop}>Set As Default</Button>
                    </div>
                    <Select label="Presets" items={cropperSettings} on:change={cropPresetsChanged} bind:value={selectedCropKey}/>
                </GroupBox>
            </div>
        {/if}
        
        {#if progressCamera}
            <div class="progress">
                <ProgressCircular color="blue" width={8} />
            </div>
        {/if}
    </div>
    <div class="faces">
        {#if faces && faces.length > 0}
            {#each faces as face, i}
                <div class="face" data-index={i}>                
                    <img src={face.imageURL} alt="Face {i + 1}" class="face-img">
                    <button class="delete" on:click={deleteFace}><i class="material-icons">delete</i></button>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style lang="scss">
    .face-extractor {
        width: 100%;

        .camera {
            display: flex;
            position: relative;

            video {
                background-color: black;
                height: 300px;
                flex: 1;
                object-fit: contain;
                object-position: center;
            }

            .btns {
                position: absolute;
                right: 0;
                top: 0;
                height: 100%;
                width: fit-content;

                padding-right: 1em;

                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .settings {
                position: absolute;
                width: 100%;
                left: 0;
                bottom: 0;
                max-height: 100%;
                overflow: hidden auto;
            }

            .progress {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: rgba(255,255,255,0.4);
            }
        }

        .faces {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            align-items: center;
            justify-items: center;
            gap: 1em;

            margin-top: 1em;

            .face {
                display: flex;
                flex-direction: column;
                position: relative;
                overflow: hidden;
                border-radius: 4px;
                border: 1px solid #ccc;

                img {
                    width: 100px;
                    height: auto;
                    object-fit: contain;
                    object-position: center;
                    padding: 0.5em;
                }

                button.delete {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 0.5em;

                    background-color: rgba(0, 0, 0, 0.7);

                    transition: background-color 100ms ease-in-out;

                    .material-icons { color: white; }

                    &:hover { background-color: rgba(0, 0, 0, 0.4); }
                    &:active { background-color: rgba(0, 0, 0, 0.9); }
                }
            }
        }
    }
</style>