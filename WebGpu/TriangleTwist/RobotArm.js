import {Color} from "../Scene Inheritance/Color.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Logger} from "../Logger.js";

class RobotArm {
    constructor() {
        const A = [0.25, 0, 0];
        const B = [-0.25, 0, 0];
        const C = [0, 1, 0];


        const web = WebGPU.Instance;
        const base = new MeshObject(
            {
                name: "Base",
                position: Vector3.fromArray([0, 0, 0.5]),
                scale: new Vector3(0.25, 0.5, 0.5),
                vertices: [B, A, C],
                color: [Color.Red, Color.Red, Color.Blue]
            }
        )
        base.angularVelocity = new Vector3(0, 0, 0.1 * Math.PI / 180)

        const child = new MeshObject(
            {
                name: "Child",
                position: Vector3.fromArray([0, 1, 0]),
                scale: new Vector3(0.5, 0.5, 1),
                vertices: [B, A, C],
                color: [Color.Blue, Color.Blue, Color.Green],
            }
        );
        child.angularVelocity = new Vector3(0.1*Math.PI/180, 0, 0);

        const grandchild = new MeshObject(
            {name: "Grandchild",
            position: Vector3.fromArray([0, 1, 0]),
            scale: new Vector3(0.5, 0.5, 1),
            vertices: [B, A, C],
            color: [Color.Green, Color.Green, Color.Red],}
        );
        grandchild.angularVelocity = new Vector3(0, 0.1 * Math.PI / 180,0)

        child.AddChild(grandchild);
        base.AddChild(child);
        web.AddShape([base])
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new RobotArm();
    window.onkeydown = WebGPU.KeyDownHelper;
    window.onkeyup = WebGPU.KeyUpHelper;
});
