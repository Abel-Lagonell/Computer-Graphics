import {Color} from "../Scene Inheritance/Color.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";

class Main {
    constructor() {
        const A = [0.25, 0, 0];
        const B = [-0.25, 0, 0];
        const C = [0, 1, 0];
        const web = WebGPU.Instance;
        const transform = new Transform(
            "Transform",
            {position: new Vector3(0, 0, 0.5),}
        );

        const base = new MeshObject(
            {
                name: "MeshObject",
                scale: new Vector3(0.25, 0.5, 0.5),
                vertices: [B, A, C],
                color: [Color.Red, Color.Red, Color.Blue],
            }
        );

        web.AddShape(transform)
        transform.AddChild(base);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new Main();
});