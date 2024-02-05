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
        this.positionBuffer = gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    }

    /**
     * Renders the given program
     * @param program : WebGLProgram
     * @param triType : number 0=>Triangles, 1=>Strip, 2=>Fan
     */
    render(program, triType) {
        let gl = this.gl
        let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);

        let colorAttributeLocation = gl.getAttribLocation(program, "a_color");
        gl.enableVertexAttribArray(colorAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        const type = gl.FLOAT; //Type of array
        const normalize = false;
        const stride = 5 * Float32Array.BYTES_PER_ELEMENT; //How many per line
        gl.vertexAttribPointer(positionAttributeLocation, 2, type, normalize, stride, 0);

        gl.vertexAttribPointer(colorAttributeLocation, 3, type, normalize, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

      switch (triType) {
          case 0: return gl.drawArrays(gl.TRIANGLES, 0, this.count);
          case 1: return gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
          case 2: return gl.drawArrays(gl.TRIANGLE_FAN, 0, this.count);
      }


    }
}

// Export the class for use in other files
export { Shape };
