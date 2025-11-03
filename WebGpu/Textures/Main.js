import {WebGPU} from "../WebGPU.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Color} from "../Scene Inheritance/Color.js";
import {SpotLight} from "../Scene Inheritance/Light/SpotLight.js";
import {PointLight} from "../Scene Inheritance/Light/PointLight.js";
import {Logger} from "../Logger.js";
import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {SixAxisController} from "../Scene Inheritance/SixAxisController.js";
import {AmbientLight} from "../Scene Inheritance/Light/AmbientLight.js";
import {DirectionalLight} from "../Scene Inheritance/Light/DirectionalLight.js";

class Main {
    constructor() {
        this.web = new WebGPU;
        this.parser = new OBJParser();
        this.BufferObject();
    }

    async BufferObject() {
        await this.web.WaitForReady();

        let ambient = new AmbientLight();
        let direction = new DirectionalLight();
        let camera = new Camera();
        Transform.setCameraReference(camera);

        let cube = await this.parser.parseObj("../STARWARS/Textured/", "TestingModel");


        let controller = new SixAxisController({
            linearSpeed: 1,
            position: new Vector3(0, +2, -5),
            rotation: new Vector3(0, Math.PI/4, 0),
        });
        controller.AddChild(camera);
        
        // camera.angularVelocity= new Vector3(0, 0.0, 2);

        this.web.AddShape([controller, cube])
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})