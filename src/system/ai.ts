import * as tf from "@tensorflow/tfjs";
import { loadLayersModel, LayersModel } from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import { writable } from "svelte/store";

const modelLoaded = writable(false);

let faceRecognitionModel:LayersModel = null;
let faceDetectionModel:facemesh.FaceLandmarksPackage = null;

async function init() {
    modelLoaded.set(false);
    faceDetectionModel = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh, {
        maxFaces: 1,
        detectionConfidence: 0.94
    });
    faceRecognitionModel = await tf.loadLayersModel("models/face_recognition/model.json");
    modelLoaded.set(true);
}

function getTensor(imageData:ImageData) {
    let tensor = tf.browser.fromPixels(imageData, 3);
    tensor = tensor.div(255).expandDims(0);
    return tensor;
}

export {
    modelLoaded, init, faceDetectionModel, faceRecognitionModel, getTensor
} 