import {WebGPU} from "../WebGPU.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {AmbientLight} from "../Scene Inheritance/Light/AmbientLight.js";
import {DirectionalLight} from "../Scene Inheritance/Light/DirectionalLight.js";
import {SimpleCharacterController} from "../Scene Inheritance/SimpleCharacterController.js";
import {CollisionObject} from "../Scene Inheritance/CollisionObject.js";

class Main {
    constructor() {
        this.web = new WebGPU;
        this.parser = new OBJParser();
        this.BufferObject();
    }

    async BufferObject() {
        await this.web.WaitForReady();

        let ambient = new AmbientLight();
        let direction = new DirectionalLight({
            color: [1, 1, 1, 1],
        });
        let camera = new Camera();
        Transform.setCameraReference(camera);

        let cube = await this.parser.parseObj("../STARWARS/Textured/", "TestingModel");
        // cube.rotation = new Vector3(0,3.1415/4,0);
        cube.AddChild(new CollisionObject({
            bounds: new Vector3(1.5,2,0)
        }))

        let controller = new SimpleCharacterController({
            linearSpeed: 5,
            position: new Vector3(0, +2, -5),
        });
        controller.AddChild(camera);
        
        await this.web.AddShape([controller, cube]);

        console.log(this.web)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})