export class InitWebGLProgram {
    /**
     * @param gl : WebGLRenderingContext
     */
    constructor(gl) {
        this.gl = gl
        this.gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.clear()
    }


    /**
     * Creates the specific shader
     * @param type : GLenum gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @param source : string A string containing the GLSL source code to set.
     * @returns {WebGLShader}
     */
    createShader(type, source) {
        let shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.error(this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
    }

    /**
     * Creates the Program to render stuff
     * @param vs : WebGLShader Vertex Shader
     * @param fs : WebGLShader Fragment Shader
     * @returns {WebGLProgram}
     */
    createProgram(vs, fs) {
        let program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        let success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if (!success) {
            console.error(this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
        }
        return program;
    }


    /**
     * Clears the board
     */
    clear(){
        this.gl.clearColor(1, 1, 1, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}