class Octahedron {
    /**
     *
     * @param gl : WebGLRenderingContext
     * @param trans : boolean
     * @param initTrans : number[]
     * @param initRot : number[]
     * @param initSca : number[]
     * @param updateRot : number[]
     */
    constructor(
        gl,
        trans = false,
        initTrans = [0.0,0.0,0.0],
        initRot = [0.0,0.0,0.0],
        initSca=[1.0,1.0,1.0],
        updateRot = [0,0,0]
    ){

        this.gl = gl;

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
        this.positionBuffer = this.gl.createBuffer();


        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        this.trans = initTrans;
        this.rot = initRot;
        this.sca = initSca;
        this.updateRot = updateRot;
        this.updateTrans = (false === trans)? [0,0,0] : [(Math.random()*2-1)/100,(Math.random()*2-1)/100,0];


    }

    update(){
        this.rot = this.rot.map((v,i) => v + this.updateRot[i]);
        this.trans = this.trans.map((v, i) => v + this.updateTrans[i])
    }

    /**
     * @param program : WebGLProgram
     */
    render(program){
        const positionAttribLocation = this.gl.getAttribLocation(program, "a_position");
        const colorAttribLocation = this.gl.getAttribLocation(program, "a_color");
        let size = 3;           //3 components per iteration
        let type = this.gl.FLOAT;    // Data in 32 bit floats

        let normalize = false // Don't normalize data
        let stride = 6 * Float32Array.BYTES_PER_ELEMENT;
        let offset = 0;         // Start at beginning
        this.gl.enableVertexAttribArray(positionAttribLocation);
        this.gl.vertexAttribPointer(positionAttribLocation, size, type, normalize, stride, offset);

        offset = 3 * Float32Array.BYTES_PER_ELEMENT;
        this.gl.enableVertexAttribArray(colorAttribLocation);
        this.gl.vertexAttribPointer(colorAttribLocation, size, type, normalize, stride, offset);

        let tranLoc = this.gl.getUniformLocation(program, 'u_transform');
        this.gl.uniform3fv(tranLoc, new Float32Array(this.trans))
        let rotLoc = this.gl.getUniformLocation(program, 'u_rotation');
        this.gl.uniform3fv(rotLoc, new Float32Array(this.rot))
        let scaLoc = this.gl.getUniformLocation(program, 'u_scale');
        this.gl.uniform3fv(scaLoc, new Float32Array(this.sca))

        const primitiveType = this.gl.TRIANGLE_STRIP;
        offset = 0;
        const count = 12;
        this.gl.drawArrays(primitiveType, offset, count);
    }
}

export {Octahedron}