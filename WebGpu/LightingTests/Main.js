import {WebGPU} from "../WebGPU.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Color} from "../Scene Inheritance/Color.js";
import {SpotLight} from "../Scene Inheritance/SpotLight.js";
import {PointLight} from "../Scene Inheritance/PointLight.js";
import {Logger} from "../Logger.js";
import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {SixAxisController} from "../Scene Inheritance/SixAxisController.js";

class Main {
    constructor() {
        this.web = new WebGPU;
        this.parser = new OBJParser();
        this.BufferObject();
    }

    async BufferObject() {
        await this.web.WaitForReady();

        let camera = new Camera({
            position: new Vector3(0,0,0),
        });
        Transform.setCameraReference(camera);

        let plane = await this.parser.parseObj("../Models/", "Plane");
        plane.scale = Vector3.One.scale(10)


        let cube = await this.parser.parseObj("../Models/", "Cube");
        cube.position = new Vector3(0,1,0)

        let pLight1 = new SpotLight({
            position: new Vector3(0,4,2),
            color: [1,1,1, 10],
            direction: new Vector3(0, -1, -1),
            focus: 0.9
        });

        let controller = new SixAxisController({
            position: new Vector3(0,3,-5),
            linearSpeed: 20,
            localSpace: false,
        });
        controller.AddChild(camera)

        await this.web.AddShape([plane, cube, pLight1, controller]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})