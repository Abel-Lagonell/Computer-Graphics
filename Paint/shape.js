class Shape {
    /**
     * Takes in gl context and an array of rgb values going from 0 to 1
     * @param gl : WebGLRenderingContext
     * @param rgb : number[]
     * @param lineType : boolean
     */
    constructor(gl, rgb, lineType) {
        this.gl = gl
        this.positions = []
        this.positionBuffer = this.gl.createBuffer()
        this.vertCount = 0;
        this.isDone = false;
        this.rgb = rgb;
        this.lineType = false;
    }

    /**
     * Pushes (x,y) into positions list
     * @param x : number
     * @param y : number
     */
    pushPoint(x,y){
        this.positions.push(x);
        this.positions.push(y);
        this.positions.push(this.rgb[0]);
        this.positions.push(this.rgb[1]);
        this.positions.push(this.rgb[2]);
        this.vertCount++;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    }

    /**
     * Draws an outline of current Shape
     * @param x : number
     * @param y : number
     */
    addTempPoint(x,y){
        this.pushPoint(x,y)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    }

    /**
     * Removes the temp points
     */
    removeTempPoint(){
        for (let i = 0; i < 5; i++) {
            this.positions.pop()
        }
        this.vertCount--;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    }

    /**
     * Adds a permanent point to the Shape
     * @param x
     * @param y
     */
    addPoint(x,y){
        throw Error("NOT IMPLEMENTED")
    }

    /**
     * Prepares the Shape to be rendered
     * @param program : WebGLProgram
     */
    prepareRender(program){
        const positionAttributeLocation = this.gl.getAttribLocation(program, "a_position");
        const colorAttributeLocation = this.gl.getAttribLocation(program, "a_color");

        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.enableVertexAttribArray(colorAttributeLocation);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const size = 2;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
        const offset = 0
        this.gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
        this.gl.vertexAttribPointer(colorAttributeLocation, 3, this.gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    /**
     * Renders the Shape
     * @param program : WebGLProgram
     */
    render(program){
        throw Error("NOT IMPLEMENTED")
    }
}

export {Shape}