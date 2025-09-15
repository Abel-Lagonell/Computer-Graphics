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

        const empty = new Transform("Empty");
        empty.Update = () => {
            empty.rotation.y += 0.01 * Math.PI/ 180
            empty.CallInChildren("Update")
        }
        
        const mesh = new MeshObject(
            {
                name: "MeshObject",
                position: new Vector3(0, 0, .5),
                vertices: [B, A, C],
                color: [Color.Red, Color.Red, Color.Red],
            }
        );

        const mesh2 = new MeshObject(
            {
                name: "MeshObject",
                position: new Vector3(0, 0, -1),
                rotation: new Vector3(0, Math.PI, 0),
                vertices: [B, A, C],
                color: [Color.Blue, Color.Blue, Color.Blue],
            }
        );

        const camera = new Camera();
        camera.Update = () => {
            camera.rotation.y += 0.09 * Math.PI / 180;
            Logger.continuousLog(
                Logger.matrixLog(camera.globalRotationMatrix, {prefix: "Camera Global Rotation"})+
                Logger.matrixLog(empty.rotationMatrix, {prefix: "Empty Rotation:"}) +
                Logger.matrixLog(mesh.globalTransformMatrix, {prefix: "Global Transform:"})
            )
        }

        Transform.setCameraReference(camera);

        web.AddShape(empty);
        // empty.AddChild(mesh);
        web.AddShape(mesh2)
        web.AddShape(mesh)
        // web.AddShape(camera);
        
        empty.AddChild(camera)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new Main();
});