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
        const shapeType = document.getElementById("shapeType");
        const color_swatch = document.getElementById("color_swatch");
        const outline = document.getElementById("outline-fill")
        r.addEventListener("input", this.sliderHandle(0));
        g.addEventListener("input", this.sliderHandle(1));
        b.addEventListener("input", this.sliderHandle(2));
        shapeType.addEventListener("click", Main.shapeH)
        color_swatch.addEventListener("change", this.swatchHandle.bind(this))
        outline.addEventListener("click", Main.fillH);
        document.getElementById("btnClear").addEventListener("click", Main.btnClear)
        document.addEventListener("keydown", this.keyDown.bind(this))
        this.canvas.addEventListener("contextmenu", this.canvasRightClick.bind(this))
        this.canvas.addEventListener("click", this.canvasHandle.bind(this));
        this.canvas.addEventListener("mousemove", this.canvasMove.bind(this));
        this.rgb = [0.5,0.5,0.5]
        this.startRGB([r.value, g.value, b.value], this.hexToRgb(color_swatch.value));
        this.shapeType = shapeType.selectedIndex;
        this.lines = !outline.selectedIndex;

    }

    /**
     * Changes the default RGB values if the sliders have not changed
     * @param sliders : number[]
     * @param swatch : number[]
     */
    startRGB(sliders, swatch){
        if (() => {
            for (let i = 0; i < sliders.length; i++) {
                if (sliders[i] !== this.rgb[i]) {
                    return false;
                }
            }
            return true
        }) {
            this.rgb = swatch;
        }
    }

    /**
     * Converts a hex number (#000000) into values that webgl can understand
     * @param hex
     * @returns {number[]}
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return [
            parseInt(result[1], 16)/255,
            parseInt(result[2], 16)/255,
            parseInt(result[3], 16)/255,
        ]
    }

    /* Static Variables */

    static fillH(){
        console.log("HERE")
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
     * Handles when the color swatch changes
     * @param event : Event
     */
    swatchHandle(event){
        const hex = event.target.value
        this.rgb = this.hexToRgb(hex);
    }

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

    /**
     * Renders a temporary point
     * @param event : MouseEvent
     */
    canvasMove(event) {
        let coords = this.getMouse(event);
        if (this.shapes.length > 0 && !this.shapes[this.shapes.length - 1].isDone) {
            this.shapes[this.shapes.length - 1].addTempPoint(coords[0], coords[1]);
            this.renderAll();
            this.shapes[this.shapes.length - 1].removeTempPoint();
        }
    }

    /**
     * Renders a new point
     * @param event : MouseEvent
     */
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
     * Controls the actions of keydown
     * @param event
     */
    keyDown(event){
        if (event.isComposing || event.keyCode === 229) {
            return;
        }
        if (event.keyCode === 90 && event.ctrlKey) {
            this.shapes.pop()
            this.renderAll()
        }
    }

    /**
     * Clears the Canvas and clears the Shape list
     */
    clearCanvas(){
        this.webGL.clear();
        this.shapes = [];
    }

    /**
     * Renders all the shapes in the stack
     */
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
