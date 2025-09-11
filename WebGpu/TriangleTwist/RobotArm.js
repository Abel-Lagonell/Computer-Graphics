import {Color} from "../Scene Inheritance/Color.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {TransformObject} from "../Scene Inheritance/TransformObject.js";

class RobotArm {
    constructor() {
        const A = [0.25, 0, 0];
        const B = [-0.25, 0, 0];
        const C = [0, 1, 0];


        const web = WebGPU.Instance;
        const base = new TransformObject(
            "Base",
            [B, A, C],
            [Color.Red, Color.Red, Color.Blue],
            [0, 0, 0.5],
            [0, 0, 0],
            new Vector3(0.25, 0.5, 0.5),
        );
        base.Update = () => {
            for (let to of base.children) {
                to.Update();
            }
            base.rotation.z += 0.1 * (Math.PI / 180);
        };

        const child = new TransformObject(
            "Child",
            [B, A, C],
            [Color.Blue, Color.Blue, Color.Green],
            [0, 1, 0],
            [0, 0, 0],
            new Vector3(0.5, 0.5, 1),
        );
        child.Update = () => {
            for (let to of child.children) {
                to.Update();
            }
            child.rotation.x += 0.1 * (Math.PI / 180);
        };

        const grandchild = new TransformObject(
            "Grandchild",
            [B, A, C],
            [Color.Green, Color.Green, Color.Red],
            [0, 1, 0],
            [0, 0, 0],
            new Vector3(1, 0.5, 1),
        );
        grandchild.Update = () => {
            for (let to of grandchild.children) {
                to.Update();
            }
            grandchild.rotation.y += 0.1 * (Math.PI / 180);
        };

        child.AddChild(grandchild);
        base.AddChild(child);

        web.AddShape(base)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new RobotArm();
    window.onkeydown = WebGPU.KeyDownHelper;
    window.onkeyup = WebGPU.KeyUpHelper;
});
