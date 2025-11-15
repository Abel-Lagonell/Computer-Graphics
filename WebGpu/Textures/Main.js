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
import {SimpleCharacterController} from "../Scene Inheritance/SimpleCharacterController.js";

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
        let cube1 = await this.parser.parseObj("../STARWARS/Textured/", "TestingModel");
        let cube2 = await this.parser.parseObj("../STARWARS/Textured/", "TestingModel");
        let cube3 = await this.parser.parseObj("../STARWARS/Textured/", "TestingModel");
        cube.angularVelocity = new Vector3(0, 1, 0)
        cube1.angularVelocity = new Vector3(0, 1, 0)
        cube2.angularVelocity = new Vector3(0, 1, 0)
        cube3.angularVelocity = new Vector3(0, 1, 0)

        cube1.position = new Vector3(0, 1, 0)
        cube2.position = new Vector3(1, 0, 0)
        cube3.position = new Vector3(0, 0, 1)


        let controller = new SimpleCharacterController({
            linearSpeed: 5,
            position: new Vector3(0, +2, -5),
        });
        controller.AddChild(camera);
        
        await this.web.AddShape([controller, cube, cube1, cube2, cube3]);

        let mesh = cube.children[0]
        await cube.RemoveChild(cube.children[0])
        console.log(mesh)
        await this.web.AddShape([mesh])
        console.log(this.web)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})