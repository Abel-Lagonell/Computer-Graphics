/**
 * author : Abel Lagonell
 */

import {Shape} from "./shape.js";
import {FreeFormShape} from "./freeFormShape.js";
import {InitWebGLProgram} from "../webgl/initWebGLProgram.js";

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

        const first_trap = [
            -1, -1,
            -0.5, 1,
            0.5, 1,
            1, -1,
        ];


        const first_trap_class = new FreeFormShape(this.scale(first_trap, 3,2 ), [1,0,0])
        let red = new Shape(this.gl, first_trap_class.get_array(), 4);
        let shapes = [red]

        const second_trap = [
            -0.5, -1,
            -0.35, -0.25,
            0.35, -0.25,
            0.5, -1,
        ];


        const second_trap_class = new FreeFormShape(this.scale(second_trap,3,2), [1,1,1])
        let white_bottom = new Shape(this.gl, second_trap_class.get_array(), 4)
        shapes.push(white_bottom)

        const white_triangle_A =[
            -0.3, 0.1,
            -0.2, 0.6,
            0.2, 0.6,
            0.3, 0.1,
        ]

        const first_white_tri = new FreeFormShape(this.scale(white_triangle_A, 3,2 ), [1,1,1])
        let white_top = new Shape(this.gl, first_white_tri.get_array(), white_triangle_A.length/2)
        shapes.push(white_top)

        const L = [
            -1, -1,
            -1, 1,
            -0.25, 1,
            -0.25, -0.5,
            1, -1,
            1, -0.5,
            -0.25, -0.5
        ]

        const l = new FreeFormShape(this.scale(L, 3, -2), [0,0,1])
        let L_shape = new Shape(this.gl, l.get_array(), L.length/2);
        shapes.push(L_shape)

        const J =[
            1, 1,
            .2, 1,
            1,-1,
            0.2, -0.5,
            -1,-1,
            -1, 0.2,
            -0.2, 0.2,
            -0.2, -0.3,

        ]

        const j = new FreeFormShape(this.scale(J, 3, 0), [0,1,0])
        let j_shape = new Shape(this.gl, j.get_array(), J.length/2)
        j_shape.render(this.program, 4)

        for (let shape of shapes) {
            shape.render(this.program, 5)
        }

    }


    scale(arr, scale, position= 1){
        let array_2 = Array(arr.length);
        for(let i = 0, length = arr.length; i < length; i++){
            array_2[i] = i%2? arr[i]: arr[i] / scale - (position/scale);
        }
        return array_2;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("myCanvas");
    const gl = canvas.getContext("webgl");

    let m = new Main(gl);
})

