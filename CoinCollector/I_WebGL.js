//@ts-check
class WebGL_Interface {
  /** @param {WebGLRenderingContext} gl*/
  constructor(gl) {
    this.gl = gl;
    this.vertexShaderSource = document.getElementById("2dVertexShader").text;
    this.fragmentShaderSource =
      document.getElementById("2dFragmentShader").text;
    this.vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      this.vertexShaderSource,
    );
    this.fragmenShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.fragmentShaderSource,
    );
    //Link to program
    this.program = this.createProgram(this.vertexShader, this.fragmenShader);
    //setup our viewport
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    //set clear colors
    this.gl.clearColor(1, 1, 1, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    //what progbram to use;

    //We will need this for now!
    this.gl.enable(this.gl.DEPTH_TEST);

    this.gl.useProgram(this.program);
  }

  /**
   * @param {GLenum} type    gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
   * @param {string} source  A string containing the GLSL source code to set
   * @returns {WebGLShader}
   */
  createShader(type, source) {
    var shader = this.gl.createShader(type);
    if (shader != null) {
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      var success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }
      //Else it didn't work
      console.error(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
    }
  }

  /**
   * @param {WebGLShader} vs Vertex Shader
   * @param {WebGLShader} fs Fragment Shader
   * @returns {WebGLProgram}
   */
  createProgram(vs, fs) {
    var program = this.gl.createProgram();
    if (program != null) {
      this.gl.attachShader(program, vs);
      this.gl.attachShader(program, fs);
      this.gl.linkProgram(program);
      var succsess = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
      if (succsess) {
        return program;
      }
      console.error(this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
    }
  }
}

export default WebGL_Interface;
