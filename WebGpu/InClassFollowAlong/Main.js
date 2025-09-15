import {Color} from "../Scene Inheritance/Color.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Camera} from "../Scene Inheritance/Camera.js";
import {Logger} from "../Logger.js";

class Main {
    constructor() {
        const A = [0.25, 0, 0];
        const B = [-0.25, 0, 0];
        const C = [0, .5, 0];
        const web = WebGPU.Instance;

        const mesh = new MeshObject(
            {
                name: "MeshObject",
                position: new Vector3(0, 0, 0.25),
                vertices: [B, A, C],
                color: [Color.Red, Color.Red, Color.Blue],
            }
        );

        const camera = new Camera();
        camera.Update = () => {
            camera.rotation.y += 0.2 * Math.PI / 180;
            Logger.continuousLog(
                Logger.matrixLog(camera.perspectiveMatrix, {prefix: "Perspective:"}) +
                Logger.matrixLog(camera.rotationMatrix, {prefix: "Camera Rotation:"}) +
                Logger.matrixLog(camera.translateMatrix, {prefix: "Camera Translate:"}) +
                Logger.matrixLog(mesh.rotationMatrix, {prefix: "Rotation:"}) +
                Logger.matrixLog(mesh.localTransformMatrix, {prefix: "Translation:"})
            )
        }

        Transform.setCameraReference(camera);

        web.AddShape(camera);
        web.AddShape(mesh)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new Main();
});