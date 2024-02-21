import { InitWebGLProgram } from "../webgl/initWebGLProgram.js";
import { Triangle } from "./triangle.js";
import {Box} from "./box.js";
import {Line} from "./line.js";
import {Circle} from "./circle.js";
import {Polygon} from "./polygon.js";

let m

export class Main {
    constructor(gl) {
        this.gl = gl;
        this.webGL = new InitWebGLProgram(gl);
        const vertexShaderSource = document.getElementById("2dVertexShader").text;
        const fragmentShaderSource = document.getElementById("2dFragmentShader").text;
        const vertexShader = this.webGL.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.webGL.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.webGL.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.program);

        /**
         * @var shapes : Shape[]
         */
        this.shapes = [];
        this.lines = false;

        this.canvas = document.getElementById("myCanvas");
        const r = document.getElementById("slider_red");
        const g = document.getElementById("slider_green");
        const b = document.getElementById("slider_blue");
        const shapeType = document.getElementById("shapeType")
        r.addEventListener("input", this.sliderHandle(0));
        g.addEventListener("input", this.sliderHandle(1));
        b.addEventListener("input", this.sliderHandle(2));
        shapeType.addEventListener("click", Main.shapeH)
        document.getElementById("outline-fill").addEventListener("click", Main.fillH);
        document.getElementById("btnClear").addEventListener("click", Main.btnClear)
        this.canvas.addEventListener("contextmenu", this.canvasRightClick.bind(this))
        this.canvas.addEventListener("click", this.canvasHandle.bind(this));
        this.canvas.addEventListener("mousemove", this.canvasMove.bind(this));

        this.rgb = [r.value, g.value, b.value]
        this.shapeType = shapeType.selectedIndex

    }

    // Static
    static fillH(){
        m.changeLineType(this)
    }

    static shapeH(){
        m.changeShapeType(this)
    }

    static btnClear(){
        m.clearCanvas();
    }

    // Handlers

    /**
     * Handles the changing of the slider values
     * @param index : number
     * @returns {(function(InputEvent): void)}
     */
    sliderHandle = (index) => (event) => {
        this.rgb[index] = event.target.value;
    }

    /**
     * Changes between Outline and Fill
     * @param event : HTMLOptionsCollection
     */
    changeLineType(event) {
        this.lines = (event.selectedIndex === 0);
    }

    /**
     * Changes between the different Shapes
     * @param event : HTMLOptionsCollection
     */
    changeShapeType(event){
        this.shapeType = event.selectedIndex
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
            switch (this.shapeType) {
                case 0: this.shapes.push(new Box(this.gl, this.rgb, this.lines)); break;
                case 1: this.shapes.push(new Line(this.gl, this.rgb)); break;
                case 2: this.shapes.push(new Circle(this.gl, this.rgb, this.lines)); break;
                case 3: this.shapes.push(new Triangle(this.gl, this.rgb, this.lines)); break;
                case 4: this.shapes.push(new Polygon(this.gl, this.rgb, this.lines)); break;
            }
        }
        //Add point to the last object
        this.shapes[this.shapes.length - 1].addPoint(coords[0], coords[1]);
        this.renderAll();
    }

    canvasRightClick(event) {
        try {
            let coords = this.getMouse(event);
            this.shapes[this.shapes.length-1].endPoint(coords[0], coords[1]);
            this.renderAll()
        } catch (e) {}
    }

    /**
     * Clears the Canvas and clears the Shape list
     */
    clearCanvas(){
        this.webGL.clear();
        this.shapes = [];
    }

    renderAll() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        for (let shape of this.shapes) {
            shape.render(this.program);
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("myCanvas");
    const gl = canvas.getContext("webgl");
    m = new Main(gl);
});
