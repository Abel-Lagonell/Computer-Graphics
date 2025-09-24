import {OBJ, OBJParser} from "../Scene Inheritance/OBJParser.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Color} from "../Scene Inheritance/Color.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";

class Main {
    constructor() {
        this.web = new WebGPU();
        this.parser = new OBJParser();
        this.BufferObjects()
    }
    
    async BufferObjects(){
        let camera = new Camera({
            position: new Vector3(0, 15, 0),
            rotation: new Vector3(15*Math.PI/180, 0, 0),
        });
        Transform.setCameraReference(camera)


        /** @type {Transform} */
        let floor = await this.parser.parseObj("../Models/", "HexFloor");
        floor.position = new Vector3(-10,-12.5, 35)

        let tree = await this.parser.parseObj("../Models/", "ConeTree");
        tree.position = new Vector3(0,0, 0)
        floor.AddChild(tree)

        let house = await this.parser.parseObj("../Models/", "House");
        house.position = new Vector3(0,0, 0)
        floor.AddChild(house);


        this.web.AddShape([camera, floor]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let m = new Main();
});