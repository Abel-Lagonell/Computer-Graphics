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
        const web = WebGPU.Instance;

        const empty = new Transform("Empty" ,{rotation: new Vector3(0, 30*Math.PI/180, 0)});
        empty.Update = () => {
            // empty.rotation.y += 0.2 * Math.PI/ 180
            empty.CallInChildren("Update")
        }
        
        const red = new MeshObject(
            {
                name: "Red",
                position: new Vector3(0, 0, .5),
                vertices: [B, A, C],
                color: [Color.Red, Color.Red, Color.Red],
            }
        );

        const blue = new MeshObject(
            {
                name: "Blue",
                position: new Vector3(0, 0, -1),
                rotation: new Vector3(0, Math.PI, 0),
                vertices: [B, A, C],
                color: [Color.Blue, Color.Blue, Color.Blue],
            }
        );

        const green = new MeshObject(
            {
                name: "Green",
                position: new Vector3(0, 1, 0.5),
                vertices: [B, A, C],
                color: [Color.Green],
            }
        );

        const camera = new Camera();
        camera.Update = () => {
            // camera.rotation.y += 0.2 * Math.PI / 180;
        }

        Transform.setCameraReference(camera);

        web.AddShape(empty);
        empty.AddChild(red);
        web.AddShape(blue)
        // web.AddShape(mesh)
        // web.AddShape(camera);
        
        empty.AddChild(camera)
        camera.AddChild(green)

        console.log(`empty is ${empty.isCameraParent? "a parent":""}`)
        console.log(`Green is ${green.isCameraChild? "a child":""}${green.isCameraSibling? "a sibling":""}`)
        console.log(`Red is ${red.isCameraChild? "a child":""}${red.isCameraSibling? "a sibling":""}`)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new Main();
});