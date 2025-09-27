import {Color} from "../Scene Inheritance/Color.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Logger} from "../Logger.js";

class Main {
    constructor() {
        const A = [0.25, -.25, 0];
        const B = [-0.25, -.25, 0];
        const C = [0, .25, 0];
        let web = new WebGPU();

        const empty = new Transform("Empty");
        empty.AngularVelocity = new Vector3(0, 0.01, 0)
        // empty.LinearVelocity = new Vector3(0.001, 0,0)
        
        const red = new MeshObject(
            {
                name: "Red",
                position: new Vector3(0, 0, 0.5),
                vertices: [B, A, C],
                color: [Color.Red, Color.Red, Color.Red],
            }
        );

        const blue = new MeshObject(
            {
                name: "Blue",
                position: new Vector3(0, 0, .75),
                vertices: [B, A, C],
                color: [Color.Blue, Color.Blue, Color.Blue],
            }
        );

        const green = new MeshObject(
            {
                name: "Green",
                position: new Vector3(0, 1, 0.25),
                vertices: [B, A, C],
                color: [Color.Green],
            }
        );

        const camera = new Camera();
        camera.AngularVelocity = new Vector3(0, -0.01, 0)
        // camera.LinearVelocity = new Vector3(-0.01, 0.0,0)

        Transform.setCameraReference(camera);

        web.AddShape([empty,blue]);
        empty.AddChild(red);

        empty.AddChild(camera)
        camera.AddChild(green)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    
    let m = new Main();
});