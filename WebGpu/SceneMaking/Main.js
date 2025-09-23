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
        
        let camera = new Camera();
        Transform.setCameraReference(camera)


        
    }
    
    async BufferObjects(){
        /** @type {Transform} */
        let floor = await this.parser.parseObj("../Models/", "HexFloor");
        floor.position = new Vector3(-10,-10, 10)
        let cam = new Camera({
            rotation: new Vector3(45*Math.PI/180,0,0)
        });
        
        Transform.setCameraReference(cam)
        
        this.web.AddShape(cam)
        this.web.AddShape(floor);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let m = new Main();
});