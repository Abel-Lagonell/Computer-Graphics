import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {PointLight} from "../Scene Inheritance/Light/PointLight.js";
import {Color} from "../Scene Inheritance/Color.js";
import {WebGPU} from "../WebGPU.js";
import {SpotLight} from "../Scene Inheritance/Light/SpotLight.js";

class Main {
    constructor() {
        this.web = new WebGPU();
        this.parser = new OBJParser();
        this.BufferObjects()
    }
    
    async BufferObjects(){
        await this.web.WaitForReady();
        
        let camera = new Camera({
            position: new Vector3(11,15, -15),
            rotation: new Vector3(-45*Math.PI/180, 0, 0),
        });
        Transform.setCameraReference(camera)


        /** @type {Transform} */
        let floor = await this.parser.parseObj("../Models/", "HexFloor");
        floor.position = new Vector3(0,0, 0)
        
        let tree = await this.parser.parseObj("../Models/", "ConeTree");
        tree.position = new Vector3(0,0, 0)
        await floor.AddChild(tree)

        let house = await this.parser.parseObj("../Models/", "House");
        house.position = new Vector3(15,1, -12)
        house.scale = Vector3.One.scale(0.75)
        await floor.AddChild(house);

        let pointLight = new PointLight({
            position: new Vector3(10,2, -10),
            color: [1,1,1,10]
        });
        await floor.AddChild(pointLight);

        let spotLight = new SpotLight({
            position: new Vector3(3,3, -12),
            color: [1,1,1,5],
            direction: new Vector3(0,-1,0.1),
            focus: 0.5
        })
        await floor.AddChild(spotLight);

        await this.web.AddShape([camera, floor]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let m = new Main();
});