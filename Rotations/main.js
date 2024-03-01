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
        // @type Octahedron[]
        this.octahedrons = [new Octahedron(this.gl)];

        //* Getting stuff from the HTML
        this.renderAll()
    }

    renderAll() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        for (let oct of this.octahedrons){
            oct.render(this.program)
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("canvas");
    const m = new Main(canvas);
})

export {Main}