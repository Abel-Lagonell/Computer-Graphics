import {Shape} from "./shape.js";

class Line extends Shape{
    /**
     * Takes in gl context and an array of rgb values going from 0 to 1
     * @param gl : WebGLRenderingContext
     * @param rgb : number[]
     */
    constructor(gl, rgb) {
        super(gl, rgb, true);
    }

    /**
     * Adds the final positions of the line and finishes the line
     * @param x : number
     * @param y : number
     */
    addPoint(x, y) {
        this.pushPoint(x,y);

        if (this.vertCount >= 2) {
            this.isDone = true;
        }
    }

    /**
     * Renders Line onto the canvas object using webgl
     * @param program : WebGLProgram
     */
    render(program) {
        this.prepareRender(program)

        let primitiveType = this.gl.LINES;
        this.gl.drawArrays(primitiveType, 0, this.vertCount);
    }
}

export {Line}