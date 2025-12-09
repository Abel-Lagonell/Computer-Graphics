import {WebGPU} from "../WebGPU.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {AmbientLight} from "../Scene Inheritance/Light/AmbientLight.js";
import {DirectionalLight} from "../Scene Inheritance/Light/DirectionalLight.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {SimpleCharacterController} from "../Scene Inheritance/SimpleCharacterController.js";
import {PickUpAble} from "../Scene Inheritance/PickUpAble.js";
import {CollisionObject} from "../Scene Inheritance/CollisionObject.js";
import {SpatialSound} from "../Scene Inheritance/SpatialSound.js";

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

        let cube = await this.parser.parseObj("../Models/", "Cube");
        let verts = cube.GetChildOfType(MeshObject).vertices

        let backgroundMusic = new SpatialSound("./Sounds/Background.wav", {
            coneOuterAngle: 360, volume: 0.2, maxDistance: 100000, autoplay: false, loop: true
        })

        const total = 1;
        for (let i = 0; i < total; i++) {
            let mesh = new MeshObject({
                name: "Cube " + i,
                position: new Vector3(-Math.sin(2 * i * 3.1415 / total) * 5, 0, Math.cos(2 * i * 3.1415 / total) * 5).scale(10),
                scale: Vector3.One.copy().scale(10),
                finalVertices: verts,
            });


            await mesh.AddChild(new PickUpAble(i, i))
            await mesh.AddChild(new CollisionObject({
                bounds: new Vector3(1, 1, 0),
            }))
            await this.web.AddShape([mesh])
        }

        let player = new SimpleCharacterController({
            linearSpeed: 10,
            position: new Vector3(0,21,0)
        });

        await this.web.AddShape([player])
        // console.log(this.web.shapes)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})