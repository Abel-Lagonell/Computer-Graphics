class Circle {
    SIZE = 30;
    DEGREES = 2 * Math.PI/this.SIZE

    /**
     * Takes in gl context and an array of rgb values going from 0 to 1
     * @param gl : WebGLRenderingContext
     * @param rgb : number[]
     */
    constructor(gl, rgb) {
        this.gl = gl;
        this.positions = [];
        this.positionBuffer = this.gl.createBuffer()
        this.vertCount = 0;
        this.isDone = false;

        this.rgb = rgb;
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

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);


    }

    /**
     * Removes the temp points
     */
    removeTempPoint(){
        for (let i = 0; i < 1*5; i++) {
            this.positions.pop()
        }
        this.vertCount -= 1;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
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
        } else {
            this.drawCircle()
        }

        console.log(this.positions)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        if (this.vertCount >= 2) {
            this.isDone = true;
        }
    }


    /**
     * Renders Box onto the canvas object using webgl
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

        let primitiveType = this.gl.TRIANGLE_FAN;
        if (!this.isDone){
            primitiveType = this.gl.LINE_LOOP;
        }
        this.gl.drawArrays(primitiveType, offset, this.vertCount);
    }
}

export {Circle};

/**
 * NEEDS TO CHANGE HOW CIRCLE IS MADE
 * Breaks when outline is needed instead of regular
 *  Basically need to delete first point and make the second point be right where the circle starts
 */