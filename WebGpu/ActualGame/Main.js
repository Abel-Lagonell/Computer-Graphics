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

        let backgroundMusic = new SpatialSound("./Sounds/Background.wav", {
            coneOuterAngle: 360, volume: 0.2, maxDistance: 100000, autoplay: false, loop: true
        })

        let player = new SimpleCharacterController({
            linearSpeed: 10,
            position: new Vector3(-15, 6.5, 0)
        });

        await this.web.AddShape([player])

        //Items

        const aisle1_sign = await this.parser.parseObj("./Models/AisleTexture/", "aisle1_sign");
        const aisle2_sign = await this.parser.parseObj("./Models/AisleTexture/", "aisle2_sign");
        const aisle3_sign = await this.parser.parseObj("./Models/AisleTexture/", "aisle3_sign");
        const counter = await this.parser.parseObj("./Models/AisleTexture/", "counter");
        // counter.AddChild(new CollisionObject({
        //     If the orientation stays the same its this if its rotated 90 degrees then flip the two values
            // bounds: new Vector3(0.75, 6.5, 0)
        // }))

        const shelf = await this.parser.parseObj("./Models/ShelfTexture/", "shelf");
        // shelf.AddChild(new CollisionObject({
        //     bounds: new Vector3(2, 6.25, 0)
        // }))
        const shelf2 = await this.parser.parseObj("./Models/ShelfTexture/", "shelf2");
        // shelf2.AddChild(new CollisionObject({
        //     bounds: new Vector3(1, 0.75, 0)
        // }))
        const endShelf = await this.parser.parseObj("./Models/ShelfTexture/", "endShelf");
        // endShelf.AddChild(new CollisionObject({
        //     bounds: new Vector3(1, 0.75, 0)
        // }))

        const zombie = await this.parser.parseObj("./Models/Zombie/", "zombie");
        // zombie.AddChild(new CollisionObject({
        //     bounds: new Vector3(1.5,0,0)
        // }))

        await this.web.AddShape([counter])

    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})