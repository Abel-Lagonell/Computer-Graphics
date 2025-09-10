import {Color} from "../Scene Inheritance/Color.js";
import {PlayerController} from "../Scene Inheritance/PlayerController.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";

class TriangleShip {
    constructor() {
        const web = WebGPU.Instance;
        const player = new PlayerController(
            "Simple triangle",
            [[-0.5, -0.5, 0.0],
                [0.5, -0.5, 0.0],
                [0.0, 0.5, 0.0]],
            [Color.Yellow, Color.Cyan, Color.Purple],
            Vector3.Zero, 
            Vector3.Zero, 
            Vector3.One.scale(0.1),
        );
        
        web.AddShape(player);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new TriangleShip();
    window.onkeydown = WebGPU.KeyDownHelper;
    window.onkeyup = WebGPU.KeyUpHelper;
});
