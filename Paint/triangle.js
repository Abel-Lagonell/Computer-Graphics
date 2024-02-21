import {Shape} from "./shape.js";
class Triangle extends Shape{
    /**
     * Takes in gl context and an array of rgb values going from 0 to 1
     * @param gl : WebGLRenderingContext
     * @param rgb : number[]
     * @param lineType : boolean
     */
    constructor(gl, rgb, lineType) {
        super(gl, rgb, lineType);
    }

    /**
     * Adds the next point to the triangle stopping once it reaches three
     * @param x : number
     * @param y : number
     */
    addPoint(x, y) {
        this.pushPoint(x,y)

        if (this.vertCount >= 3) {
            this.isDone = true;
        }
    }

    /**
     * Renders Triangle onto the canvas object using webgl
     * @param program : WebGLProgram
     */
    render(program) {
        this.prepareRender(program)

        let primitiveType = this.gl.TRIANGLES  ;
        if (!this.isDone || this.lineType){
            primitiveType = this.gl.LINE_LOOP
        }
        this.gl.drawArrays(primitiveType, 0, this.vertCount);
    }
}

export {Triangle}