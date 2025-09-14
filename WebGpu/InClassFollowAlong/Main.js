import {Color} from "../Scene Inheritance/Color.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Camera} from "../Scene Inheritance/Camera.js";

class Main {
    constructor() {
        const A = [0.25, 0, 0];
        const B = [-0.25, 0, 0];
        const C = [0, .5, 0];
        const web = WebGPU.Instance;
        const transform = new Transform(
            "Transform",
            {position: new Vector3(0, -0.25, 0.5),}
        );

        const base = new MeshObject(
            {
                name: "MeshObject",
                scale: new Vector3(1, 1, 1),
                vertices: [B, A, C],
                color: [Color.Red, Color.Red, Color.Blue],
            }
        );
        
        const camera = new Camera();
        camera.Update = () => {
            camera.rotation.y += 0.2 * Math.PI / 180;
            // Logger.continuousLog(
            //     camera.rotation.array+  "<br\>"+
            //     Logger.matrixLog(camera.perspectiveMatrix, {prefix: "Perspective:"}) +
            //     Logger.matrixLog(camera.rotationMatrix, {prefix: "Camera Rotation:"}) +
            //     Logger.matrixLog(camera.translateMatrix, {prefix: "Camera Translate:"}) +
            //     Logger.matrixLog(base.rotationMatrix, {prefix: "Rotation:"}) + 
            //     Logger.matrixLog(base.translateMatrix, {prefix: "Translation:"})
            // )
        }
        
        Transform.setCameraReference( camera);
        
        web.AddShape(camera);
        web.AddShape(transform)
        transform.AddChild(base);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new Main();
});