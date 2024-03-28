//@ts-check
class Transform {
  constructor() {
    this.forward = [0, 0, 1];
    this.right = [1, 0, 0];
    this.up = [0, 1, 0];
  }

  /**@param {number[]} RotAngles*/
  doRotations(RotAngles) {
    this.xRot = [
      [1, 0, 0, 0],
      [0, Math.cos(RotAngles[0]), -1 * Math.sin(RotAngles[0]), 0],
      [0, Math.sin(RotAngles[0]), Math.cos(RotAngles[0]), 0],
      [0, 0, 0, 1],
    ];
    this.yRot = [
      [Math.cos(RotAngles[1]), 0, Math.sin(RotAngles[1]), 0],
      [0, 1, 0, 0],
      [-1 * Math.sin(RotAngles[1]), 0, Math.cos(RotAngles[1]), 0],
      [0, 0, 0, 1],
    ];
    this.zRot = [
      [Math.cos(RotAngles[2]), -1 * Math.sin(RotAngles[2]), 0, 0],
      [Math.sin(RotAngles[2]), Math.cos(RotAngles[2]), 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    //this.forward = this.crossMultiply(xRot,[0,0,1,0]);
    this.forward = this.crossMultiply(
      this.zRot,
      this.crossMultiply(
        this.yRot,
        this.crossMultiply(this.xRot, [0, 0, 1, 0]),
      ),
    );
    this.right = this.crossMultiply(
      this.zRot,
      this.crossMultiply(
        this.yRot,
        this.crossMultiply(this.xRot, [1, 0, 0, 0]),
      ),
    );
    this.up = this.crossMultiply(
      this.zRot,
      this.crossMultiply(
        this.yRot,
        this.crossMultiply(this.xRot, [0, 1, 0, 0]),
      ),
    );
  }

  /**
   * @param {number[][]} M
   * @param {number[]} V
   */
  crossMultiply(M, V) {
    //console.log(M[0][3]);
    //console.log(V[3]);
    var temp = [
      M[0][0] * V[0] + M[0][1] * V[1] + M[0][2] * V[2] + M[0][3] * V[3],
      M[1][0] * V[0] + M[1][1] * V[1] + M[1][2] * V[2] + M[1][3] * V[3],
      M[2][0] * V[0] + M[2][1] * V[1] + M[2][2] * V[2] + M[2][3] * V[3],
      M[3][0] * V[0] + M[3][1] * V[1] + M[3][2] * V[2] + M[3][3] * V[3],
    ];
    //console.log(temp);
    return temp;
  }
}

class GameObject {
  constructor() {
    this.loc = [0, 0, 0];
    this.rot = [0, 0, 0];
    this.isTrigger = false;
    this.collisionRadius = 0.1;
    this.velocity = [0, 0, 0];
    this.angVelocity = [0, 0, 0];
    this.name = "Default";
    this.id = 0;
    this.transform = new Transform();
    this.prefab;
  }

  Move() {
    var tempP = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
      tempP[i] = this.loc[i];
      tempP[i] += this.velocity[i];
      this.rot[i] += this.angVelocity[i];
    }

    var clear = true;
    for (var so in m.Solid) {
      if (m.Solid[so] != this) {
        if (
          m.CheckCollision(
            tempP,
            this.collisionRadius,
            m.Solid[so].loc,
            m.Solid[so].collisionRadius,
          )
        ) {
          if (!this.isTrigger) {
            this.OnCollisionEnter(m.Solid[so]);
            m.Solid[so].OnCollisionEnter(this);
            clear = false;
          } else {
            this.OnTriggerEnter(m.Solid[so]);
            m.Solid[so].OnTriggerEnter(this);
          }
        }
      }
    }
    if (clear) {
      this.loc = tempP;
    }
    //what happens if a trigger object collides with another trigger object
    for (var to in m.Trigger) {
      if (m.Trigger[to] != this) {
        if (
          m.CheckCollision(
            tempP,
            this.collisionRadius,
            m.Trigger[to].loc,
            m.Trigger[to].collisionRadius,
          )
        ) {
          this.OnTriggerEnter(m.Trigger[to]);
          m.Trigger[to].OnTriggerEnter(this);
        }
      }
    }
  }

  //Abstract fucntions, think Unity
  Update() {
    console.error(this.name + " update() is NOT IMPLEMENTED!");
  }
  Render(program) {
    console.error(this.name + " render() is NOT IMPLEMENTED!");
  }

  OnTriggerEnter(other) {}

  OnCollisionEnter(other) {}
}

class DemoCharacter extends GameObject {
  constructor() {
    super();

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    //Now we want to add color to our vertices information.
    this.vertices = [
      -0.5, -0.5, 0, 0, 0, 0, 0.5, -0.5, 0, 1, 0, 0, 0, 0.5, 0, 1, 0, 0,

      -0.5, -0.5, 0, 0, 1, 0, 0, 0, -0.5, 0, 1, 0, 0.5, -0.5, 0, 0, 1, 0,

      0, 0, -0.5, 0, 0, 1, 0.5, -0.5, 0, 0, 0, 1, 0, 0.5, 0, 0, 0, 1,

      0, 0.5, 0, 1, 1, 0, 0, 0, -0.5, 1, 1, 0, -0.5, -0.5, 0, 1, 1, 0,
    ];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );
    this.loc = [0.0, 0.0, 0.0];
    this.rot = [0.0, 0.0, 0.0];
  }

  Update() {
    this.velocity = [0, 0, 0];
    this.angVelocity = [0, 0, 0];
    if (m.TestKey("A")) {
      this.angVelocity[2] = -0.01;
    }
    if (m.TestKey("D")) {
      this.angVelocity[2] = 0.01;
    }

    let dir = this.transform.doRotations(this.rot);
    let direction = this.transform.up;

    if (m.TestKey("W")) {
      for (let i = 0; i < 3; i++) {
        this.velocity[i] = direction[i] * 0.01;
      }
    }

    if (m.TestKey("S")) {
      for (let i = 0; i < 3; i++) {
        this.velocity[i] = direction[i] * -0.01;
      }
    }
    this.Move();
  }

  /**@param {WebGLProgram} program */
  Render(program) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    //First we bind the buffer for triangle 1
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var size = 3; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 6 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element     // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    //Now we have to do this for color
    var colorAttributeLocation = gl.getAttribLocation(program, "vert_color");
    //We don't have to bind because we already have the correct buffer bound.
    size = 3;
    type = gl.FLOAT;
    normalize = false;
    stride = 6 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element
    offset = 3 * Float32Array.BYTES_PER_ELEMENT; //size of the offset
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(
      colorAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    var tranLoc = gl.getUniformLocation(program, "transform");
    gl.uniform3fv(tranLoc, new Float32Array(this.loc));
    var thetaLoc = gl.getUniformLocation(program, "u_rotation");
    gl.uniform3fv(thetaLoc, new Float32Array(this.rot));

    var primitiveType = gl.TRIANGLES;
    offset = 0;
    var count = 12;
    gl.drawArrays(primitiveType, offset, count);
  }
}

export { GameObject, DemoCharacter };
