import { InitWebGLProgram } from "../webgl/initWebGLProgram.js";
import { Triangle } from "./triangle.js";
import {Box} from "./box.js";
import {Line} from "./line.js";
import {Circle} from "./circle.js";
import {Polygon} from "./polygon.js";

export class Main {
    constructor(gl) {
        this.gl = gl;
        this.webGL = new InitWebGLProgram(gl);
        const vertexShaderSource = document.getElementById("2dVertexShader").text;
        const fragmentShaderSource = document.getElementById("2dFragmentShader").text;
        const vertexShader = this.webGL.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.webGL.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.webGL.createProgram(vertexShader, fragmentShader);
        gl.useProgram(this.program);

        this.shapes = [];

        this.canvas = document.getElementById("myCanvas");
        this.canvas.addEventListener("contextmenu", this.canvasRightClick.bind(this))
        this.canvas.addEventListener("click", this.canvasHandle.bind(this));
        this.canvas.addEventListener("mousemove", this.canvasMove.bind(this));
    }

    getMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        const realX = event.clientX - rect.left;
        const realY = event.clientY - rect.top;
        let x = -1 + 2 * realX / this.canvas.width;
        let y = -1 + 2 * (this.canvas.height - realY) / this.canvas.height;
        return [x, y];
    }

    canvasMove(event) {
        let coords = this.getMouse(event);
        if (this.shapes.length > 0 && !this.shapes[this.shapes.length - 1].isDone) {
            this.shapes[this.shapes.length - 1].addTempPoint(coords[0], coords[1]);
            this.renderAll();
            this.shapes[this.shapes.length - 1].removeTempPoint();
        }
    }

    canvasHandle(event) {
        let coords = this.getMouse(event);
        if (this.shapes.length === 0 || this.shapes[this.shapes.length - 1].isDone) {
            //New Object
            this.shapes.push(new Polygon(this.gl, [1,0,0]));
        }
        //Add point to the last object
        this.shapes[this.shapes.length - 1].addPoint(coords[0], coords[1]);

        this.renderAll();
    }

    canvasRightClick(event) {
        try {
            this.shapes[this.shapes.length-1].endPoint();
        } catch (e) {}
    }

    renderAll() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        for (let shape of this.shapes) {
            shape.render(this.program, false);
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("myCanvas");
    const gl = canvas.getContext("webgl");
    const m = new Main(gl);
});
