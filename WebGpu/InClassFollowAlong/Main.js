import {BasicPolygon} from "../BasicPolygon.js";
import {Color} from "../Scene Inheritance/Color.js";

class Main {
    constructor() {
        const web = WebGPU.Instance;
        const triangle = new BasicPolygon(
            [[-0.5, -0.5, 0.0],
                [0.5, -0.5, 0.0],
                [0.0, 0.5, 0.0]],
            [Color.Yellow, Color.Cyan, Color.Purple],
            "Simple triangle", [-.5, -.5, .5], [0, 0, 0], [1, 1, 1]);
        let triangle22 = new BasicPolygon(
            [[-0.5, -0.5, 0.0],
                [0.5, -0.5, 0.0],
                [0.0, 0.5, 0.0]],
            [Color.Red, Color.Blue, Color.Green],
            "Simple triangle", [.5,.5,.5], [0,0,0], [1,1,1])
        web.AddShape(triangle)
        web.AddShape(triangle22)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new Main();
});