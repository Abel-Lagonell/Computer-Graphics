import {Shape} from "./shape.js";

class Box extends Shape{
    SIZE = 4

    /**
     * Takes in gl context and an array of rgb values going from 0 to 1
     * @param gl : WebGLRenderingContext
     * @param rgb : number[]
     * @param lineType : boolean
     */
    constructor(gl, rgb, lineType) {
        super(gl ,rgb, lineType)
    }

    /**
     * Takes (x,y) and displays a box with it
     * @param x : number
     * @param y : number
     */
    addTempPoint(x,y){

        this.pushPoint(this.positions[0], y);
        this.pushPoint(x,y);
        this.pushPoint(x, this.positions[1]);
    }

    /**
     * Removes the temp points
     */
    removeTempPoint(){
        for (let i = 0; i < (this.SIZE-1)*5; i++) {
            this.positions.pop()
        }
        this.vertCount-= 3;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    }

    /**
     * Adds the final positions of the boxes to finalize the shape
     * @param x : number
     * @param y : number
     */
    addPoint(x, y) {

        if (this.vertCount <= 0){
            this.pushPoint(x,y);
        } else {
            this.pushPoint(this.positions[0], y);
            this.pushPoint(x,y);
            this.pushPoint(x, this.positions[1]);
        }

        if (this.vertCount >= 4) {
            this.isDone = true;
        }
    }


    /**
     * Renders Box onto the canvas object using webgl
     * @param program : WebGLProgram
     */
    render(program) {
        this.prepareRender(program)

        let primitiveType = this.gl.TRIANGLE_FAN;
        if (!this.isDone || this.lineType){
            primitiveType = this.gl.LINE_LOOP
        }
        this.gl.drawArrays(primitiveType, 0, this.vertCount);
    }
}

export {Box}