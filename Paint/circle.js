class Circle {
    SIZE = 5;

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
        console.log(this.positions)
    }

    theta(n){
        return (360/this.SIZE) * n;
    }

    x_coord(n, radius){
        return radius * Math.cos(this.theta(n)) + this.positions[0];
    }

    y_coord(n, radius){
        return radius * Math.sin(this.theta(n)) + this.positions[1];
    }

    drawCircle(radius){
        for (let i = 0; i < this.SIZE-1; ){
            this.pushPoint(this.x_coord(i, radius), this.y_coord(i, radius))
        }
    }

    /**
     * Takes (x,y) and displays a Circle with it
     * @param x : number
     * @param y : number
     */
    addTempPoint(x,y){
        this.drawCircle(Math.hypot((this.positions[0]-x),(this.positions[1]-y)))

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        this.vertCount+= this.SIZE-1;
    }

    /**
     * Removes the temp points
     */
    removeTempPoint(){
        for (let i = 0; i < (this.SIZE-1)*5; i++) {
            this.positions.pop()
        }
        this.vertCount-= this.SIZE-1;
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

        if (this.vertCount <= 0){
            this.vertCount++;
        } else {
            this.drawCircle(Math.hypot((this.positions[0]-x),(this.positions[1]-y)))
            this.vertCount += this.SIZE-1;
        }

        console.log(this.positions)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);

        if (this.vertCount >= this.SIZE) {
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
            primitiveType = this.gl.LINE_LOOP
        }
        this.gl.drawArrays(primitiveType, offset, this.vertCount);
    }
}

export {Circle}