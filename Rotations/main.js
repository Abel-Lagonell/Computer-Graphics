import {InitWebGLProgram} from "../webgl/initWebGLProgram.js";
import {Octahedron} from "./octahedron.js";

class Main {
    /** @param canvas : HTMLCanvasElement */
    constructor(canvas) {

        //* Setting up constants

        this.canvas = canvas
        this.gl = canvas.getContext("webgl");
        this.webGL = new InitWebGLProgram(this.gl);
        const vertexShaderSource = document.getElementById("3dVertexShader").text;
        const fragmentShaderSource = document.getElementById("3dFragmentShader").text;
        const vertexShader = this.webGL.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.webGL.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.webGL.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);

        const upperCenter =  new Octahedron(this.gl, false, [0.0,0.5,0.0], [0.0,0.0,0.0], [0.25,0.25,0.25], [0,0.01,0])
        const lowerLeft =  new Octahedron(this.gl, false, [0.5,-0.5,0.0], [0.0,0.0,0.0], [0.25,0.25,0.25], [0,0,0.01])
        const lowerRight =  new Octahedron(this.gl, false, [-0.5,-0.5,0.0], [0.0,0.0,0.0], [0.25,0.25,0.25], [0.01,0,0])
        this.octahedrons = [upperCenter, lowerLeft, lowerRight];

        //* Getting stuff from the HTML
        this.canvas.addEventListener("click", this.canvasHandle.bind(this));
        this.mainLoop()
    }

    mainLoop(){
        this.updateAll();
        this.renderAll();
        requestAnimationFrame(() => this.mainLoop());
    }

    renderAll() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        for (let oct of this.octahedrons){
            oct.render(this.program)
        }
    }

    updateAll(){
        for (let oct of this.octahedrons){
            oct.update()
        }
    }

    /**
     * Renders a new point
     * @param event : MouseEvent
     */
    canvasHandle(event) {
        let coords = this.getMouse(event);
        this.octahedrons.push(
            new Octahedron(this.gl, true, [...coords, 0.0], [0,0,0], [0.25,0.25,0.25], [0,0,0])
        )
    }


    /**
     * Gets where the mouse is with canvas bounds in mind
     * @param event : MouseEvent
     * @returns {[number, number]}
     */
    getMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        const realX = event.clientX - rect.left;
        const realY = event.clientY - rect.top;
        let x = -1 + 2 * realX / this.canvas.width;
        let y = -1 + 2 * (this.canvas.height - realY) / this.canvas.height;
        return [x, y];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementsByTagName("Canvas")[0];
    const m = new Main(canvas);
})

export {Main}