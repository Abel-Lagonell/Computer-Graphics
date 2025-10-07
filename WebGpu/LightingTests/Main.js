import {WebGPU} from "../WebGPU.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Color} from "../Scene Inheritance/Color.js";
import {SpotLight} from "../Scene Inheritance/SpotLight.js";
import {PointLight} from "../Scene Inheritance/PointLight.js";
import {Logger} from "../Logger.js";

class Main {
    constructor() {
        this.web = new WebGPU;
        
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let m = new Main();
})