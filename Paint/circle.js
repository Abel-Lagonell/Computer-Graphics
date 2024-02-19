import {Shape} from "./shape.js"

class Circle extends Shape{
    SIZE = 30;
    DEGREES = 2 * Math.PI/this.SIZE

    /**
     * Takes in gl context and an array of rgb values going from 0 to 1
     * @param gl : WebGLRenderingContext
     * @param rgb : number[]
     */
    constructor(gl, rgb) {
        super(gl, rgb)
        this.center = [0,0];
        this.radius = 0;
    }

    /**
     * Gets the Radius
     */
    distance(){
        let point = [this.positions[5],this.positions[6]];
        this.radius = Math.hypot(this.center[0] - point[0], this.center[1] - point[1]);
    }

    /**
     * Gets the coordinates for point n
     * @param n : number
     * @returns {number[]}
     */
    point_n(n){
        let x = this.radius * Math.cos(this.DEGREES * n) + this.center[0];
        let y = this.radius * Math.sin(this.DEGREES * n) + this.center[1];
        return [x,y];
    }

    /**
     * Draws a circle with given radius
     */
    drawCircle(){
        this.distance()
        for (let i =0; i < this.SIZE; i++ ){
            let coord = this.point_n(i)
            this.pushPoint(coord[0], coord[1])
        }
        let coord = this.point_n(0);
        this.pushPoint(coord[0],coord[1])
    }

    /**
     * Takes (x,y) and displays a Circle with it
     * @param x : number
     * @param y : number
     */
    addTempPoint(x,y){
        if (this.vertCount >= 1){
            this.pushPoint(x,y)
        }
        else {
            this.pushPoint(x,y)
            this.drawCircle()
        }
    }

    /**
     * Adds the final positions of the boxes to finalize the shape
     * @param x : number
     * @param y : number
     */
    addPoint(x, y) {
        this.pushPoint(x,y);

        if (this.vertCount ===1 ){
            this.center = [this.positions[0], this.positions[1]]
        }
        if (this.vertCount >= 2) {
            this.drawCircle()
            this.isDone = true;
        }
    }

    /**
     * Renders Circle onto the canvas object using webgl
     * @param program : WebGLProgram
     * @param lines : boolean
     */
    render(program, lines) {
        this.prepareRender(program)
        let primitiveType = this.gl.TRIANGLE_FAN;
        if (!this.isDone){
            primitiveType = this.gl.LINE_LOOP;
        }
        if (lines) {
            primitiveType = this.gl.LINE_LOOP
            if (this.positions.length/5 >= 3){
                this.positions[0] = this.positions[this.positions.length-5]
                this.positions[1] = this.positions[this.positions.length-4]
                this.positions[5] = this.positions[this.positions.length-10]
                this.positions[6] = this.positions[this.positions.length-9]
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
            }

        }

        this.gl.drawArrays(primitiveType, 0, this.vertCount);
    }
}

export {Circle};