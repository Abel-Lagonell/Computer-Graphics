class Octahedron {
    /** @param gl : WebGLRenderingContext */
    constructor(gl) {
        this.gl = gl;
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

        const A = [1, 0 ,0]; //red
        const B = [0, 1, 0]; //red+green
        const C = [-1, 0 ,0]; //green
        const D = [0, -1, 0]; //green+blue
        const E = [0, 0, 1]; // blue
        const F = [0, 0, -1]; // blue+ red
        const red = [1, 0, 0];
        const blue = [0, 1, 0];
        const green = [0, 0, 1];



        // @type {number[]}
        this.vertices =[
            ...E,   ...blue,
            ...C,   ...green,
            ...B,   ...(red.map((v,i) => v + green[i])),
            ...F,   ...(blue.map((v,i) => v + red[i])),
            ...A,   ...red,
            ...D,   ...(blue.map((v,i) => v + green[i])),
            ...F,   ...(blue.map((v,i) => v + red[i])),
            ...C,   ...green,
            ...D,   ...(blue.map((v,i) => v + green[i])),
            ...E,   ...blue,
            ...A,   ...red,
            ...B,   ...(red.map((v,i) => v + green[i]))
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    }

    /**
     * @param program : WebGLProgram
     */
    render(program){
        const positionAttribLocation = this.gl.getAttribLocation(program, "a_position");
        this.gl.enableVertexAttribArray(positionAttribLocation);
        let size = 3;           //3 components per iteration
        let type = this.gl.FLOAT;    // Data in 32 bit floats
        let normalize = false // Don't normalize data
        let stride = 6 * Float32Array.BYTES_PER_ELEMENT;
        let offset = 0;         // Start at beginning
        this.gl.vertexAttribPointer(positionAttribLocation, size, type, normalize, stride, offset);

        const colorAttribLocation = this.gl.getAttribLocation(program, "a_color");
        this.gl.enableVertexAttribArray(colorAttribLocation);
        offset = 3 * Float32Array.BYTES_PER_ELEMENT;
        this.gl.vertexAttribPointer(colorAttribLocation, size, type, normalize, stride, offset);

        const primitiveType = this.gl.TRIANGLE_STRIP;
        offset = 0;
        const count = 12;
        this.gl.drawArrays(primitiveType, offset, count);
    }
}

export {Octahedron}