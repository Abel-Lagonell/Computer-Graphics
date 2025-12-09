import {WebGPU} from "../WebGPU.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {AmbientLight} from "../Scene Inheritance/Light/AmbientLight.js";
import {DirectionalLight} from "../Scene Inheritance/Light/DirectionalLight.js";
import {SimpleCharacterController} from "../Scene Inheritance/SimpleCharacterController.js";
import {SpatialSound} from "../Scene Inheritance/SpatialSound.js";
import {Zombie} from "../Scene Inheritance/Zombie.js";
import {GameEngine} from "./GameEngine.js";

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

        let backgroundMusic = new SpatialSound("./Sounds/Background.wav", {
            coneOuterAngle: 360, volume: 0.2, maxDistance: 100000, autoplay: false, loop: true
        })

        let player = new SimpleCharacterController({
            linearSpeed: 10,
            position: new Vector3(-15, 6.5, 0)
        });

        await this.web.AddShape([player])

        //Items
        let gameEngine = new GameEngine(this.web);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})