class Line {
    /**
     * Takes in gl context and an array of rgb values going from 0 to 1
     * @param gl : WebGLRenderingContext
     * @param rgb : number[]
     */
    constructor(gl, rgb) {
        this.gl = gl
        this.positions = []
        this.positionBuffer = this.gl.createBuffer()
        this.vertCount = 0;
        this.isDone = false;

        this.rgb = rgb;
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
    }

    /**
     * Takes (x,y) and displays a box with it
     * @param x : number
     * @param y : number
     */
    addTempPoint(x,y){
        this.pushPoint(x,y);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        this.vertCount+= 1;
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
     * Adds the final positions of the line and finishes the line
     * @param x : number
     * @param y : number
     */
    addPoint(x, y) {
        this.pushPoint(x,y);

        this.vertCount++;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        if (this.vertCount >= 2) {
            this.isDone = true;
        }
    }


    /**
     * Renders Line onto the canvas object using webgl
     * @param program : WebGLProgram
     */
    render(program) {
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

        let primitiveType = this.gl.LINES;
        if (!this.isDone){
            primitiveType = this.gl.LINES;
        }
        this.gl.drawArrays(primitiveType, offset, this.vertCount);
    }
}

export {Line}