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
        let [cube1, cube2] = await this.parser.parseObj("./SimpleCube");
    
        
        let cube01 = new MeshObject({
            name: cube1.name,
            vertices: cube1.GetTriangleList(),
            color: cube1.GetColorList(),
            position: new Vector3(0,0,0)
        })

        let cube02 = new MeshObject({
            name: cube2.name,
            vertices: cube2.GetTriangleList(),
            color: cube2.GetColorList(),
            position: new Vector3(0,0,0)
        }) 
        
        let empty = new Transform("empty", {position: new Vector3(0,0,10),
        rotation: new Vector3(0,3.14/2,0),});
        
        console.log(cube2.GetTriangleList())
        
        empty.AddChild(cube01);
        empty.AddChild(cube02);
        this.web.AddShape(empty)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let m = new Main();
});