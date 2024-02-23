/**
 * author : Abel Lagonell
 */

import {Shape} from "./shape.js";
import {InitWebGLProgram} from "../webgl/initWebGLProgram";

class Main {
    /**
     * @param gl : {WebGLRenderingContext}
     */
    constructor(gl) {
        this.gl = gl
        this.webGL = new InitWebGLProgram(this.gl);
        const vertexShaderSource = document.getElementById("2dVertexShader").text;
        const fragmentShaderSource = document.getElementById("2dFragmentShader").text;
        const vertexShader = this.webGL.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.webGL.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.webGL.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);

        this.positions = [
            0, 0.5, 1, 0, 0,
            1, 0.5, 1, 1, 0,
            0.5, 1, 0, 1, 0,
            0.5, 0, 0, 1, 1,
            0, 	-1, 0, 0, 1,
            -0.5, 0, 1, 0, 1,
        ];

        let temp = new Shape(this.gl, this.positions, 6);
        temp.render(this.program, 0);
    }


    /**
     * Makes the triangles with the given triangle type
     * @param triType : number 0=>Triangles, 1=>Strip, 2=>Fan
     */
    change(triType){
        this.webGL.clear()
        let temp = new Shape(this.gl, this.positions, 6);
        temp.render(this.program, triType);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("myCanvas");
    const gl = canvas.getContext("webgl");
    const tri = document.getElementById("tri")
    const tri_strip = document.getElementById("tri_strip")
    const tri_fan = document.getElementById("tri_fan")
    const dropdown = document.getElementById("type")

    let m = new Main(gl);
    tri.onclick= (_) => {m.change(0); dropdown.innerText = "Triangle ▼"}
    tri_strip.onclick = (_) => {m.change(1); dropdown.innerText = "Triangle Strip ▼"}
    tri_fan.onclick = (_) => {m.change(2); dropdown.innerText = "Triangle Fan ▼"}
})

