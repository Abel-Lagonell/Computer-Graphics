class Shape {
    /**
     * @param gl : {WebGLRenderingContext}
     * @param positions : number[]
     * @param count : number
     */
    constructor(gl, positions, count ) {
        this.gl = gl;
        this.positions = positions;
        this.count = count
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    }

    /**
     * Renders the given program
     * @param program : WebGLProgram
     * @param triType : number 0=>Lines, 1=>Line Loop, 2=>Line Strip, 3=>Triangles, 4=>Triangle Strip, 5=>Fan
     */
    render(program, triType) {
        let positionAttributeLocation = this.gl.getAttribLocation(program, "a_position");
        this.gl.enableVertexAttribArray(positionAttributeLocation);

        let colorAttributeLocation = this.gl.getAttribLocation(program, "a_color");
        this.gl.enableVertexAttribArray(colorAttributeLocation);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const type = this.gl.FLOAT; //Type of array
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; //How many per line
        this.gl.vertexAttribPointer(positionAttributeLocation, 2, type, normalize, stride, 0);

        this.gl.vertexAttribPointer(colorAttributeLocation, 3, type, normalize, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

      switch (triType) {
          case 3: return this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
          case 4: return this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.count);
          case 5: return this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, this.count);
          case 0: return this.gl.drawArrays(this.gl.LINES, 0, this.count);
          case 1: return this.gl.drawArrays(this.gl.LINE_LOOP, 0, this.count);
          case 2: return this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.count);
          default: return this.gl.drawArrays(this.gl.POINTS, 0, this.count);
      }
    }

    add_positions(positions){
        this.positions = this.positions.concat(positions)

        this.count += positions.length/5
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER_BINDING, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    }
}

// Export the class for use in other files
export { Shape };
