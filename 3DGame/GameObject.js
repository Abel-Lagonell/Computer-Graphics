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
    return [
      M[0][0] * V[0] + M[0][1] * V[1] + M[0][2] * V[2] + M[0][3] * V[3],
      M[1][0] * V[0] + M[1][1] * V[1] + M[1][2] * V[2] + M[1][3] * V[3],
      M[2][0] * V[0] + M[2][1] * V[1] + M[2][2] * V[2] + M[2][3] * V[3],
      M[3][0] * V[0] + M[3][1] * V[1] + M[3][2] * V[2] + M[3][3] * V[3],
    ];
  }
}

const collision = Object.freeze({
  Sphere: 0,
  Box: 1,
  undefined: undefined,
});

class GameObject {
  constructor() {
    this.gl = gl;
    this.isTrigger = false;
    this.id = 0;
    this.health = 0;

    this.loc = [0, 0, 0];
    this.rot = [0, 0, 0];
    this.scale = [1, 1, 1];

    this.velocity = [0, 0, 0];
    this.angVelocity = [0, 0, 0];

    /** @type {number | undefined} */
    this.collisionType = collision.undefined;
    /** @type {number[] | undefined} [x, y, z] with each one describing how far in each direction it's going*/
    this.boxCollider = undefined;
    /** @type {number | undefined} Must be positive */
    this.circleCollider = undefined;

    this.transform = new Transform();
    this.vertCount = 0;
    this.primitiveType = this.gl.TRIANGLES;
    this.buffer = this.gl.createBuffer();
    this.tag = "Default";
  }

  Move() {
    let tempP = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      tempP[i] = this.loc[i];
      tempP[i] += this.velocity[i];
      this.rot[i] += this.angVelocity[i];
    }

    let clear = true;
    for (let so in _main.solid) {
      if (_main.solid[so] !== this) {
        if (_main.checkCollision(tempP, this, _main.solid[so])) {
          if (!this.isTrigger) {
            this.OnCollisionEnter(_main.solid[so]);
            _main.solid[so]?.OnCollisionEnter(this);
            clear = false;
          } else {
            this.OnTriggerEnter(_main.solid[so]);
            _main.solid[so]?.OnTriggerEnter(this);
          }
        }
      }
    }
    if (clear) {
      this.loc = tempP;
    }
    //what happens if a trigger object collides with another trigger object
    for (let to in _main.trigger) {
      if (_main.trigger[to] !== this) {
        if (_main.checkCollision(tempP, this, _main.trigger[to])) {
          this.OnTriggerEnter(_main.trigger[to]);
          _main.trigger[to]?.OnTriggerEnter(this);
        }
      }
    }
  }

  //Abstract functions, think Unity
  update() {
    console.error(this.tag + " update() is NOT IMPLEMENTED!");
  }

  /**@param {WebGLProgram} program*/
  render(program) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

    //First we bind the buffer for triangle 1
    let positionAttributeLocation = this.gl.getAttribLocation(
      program,
      "a_position",
    );
    let size = 3; // 2 components per iteration
    let type = this.gl.FLOAT; // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 6 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element     // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0; // start at the beginning of the buffer
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    this.gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    //Now we have to do this for color
    const colorAttributeLocation = this.gl.getAttribLocation(
      program,
      "vert_color",
    );
    //We don't have to bind because we already have the correct buffer bound.
    size = 3;
    type = this.gl.FLOAT;
    normalize = false;
    stride = 6 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element
    offset = 3 * Float32Array.BYTES_PER_ELEMENT; //size of the offset
    this.gl.enableVertexAttribArray(colorAttributeLocation);
    this.gl.vertexAttribPointer(
      colorAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    const tranLoc = this.gl.getUniformLocation(program, "u_transform");
    const thetaLoc = this.gl.getUniformLocation(program, "u_rotation");
    const scaleLoc = this.gl.getUniformLocation(program, "u_scale");
    this.gl.uniform3fv(tranLoc, new Float32Array(this.loc));
    this.gl.uniform3fv(thetaLoc, new Float32Array(this.rot));
    this.gl.uniform3fv(scaleLoc, new Float32Array(this.scale));

    offset = 0;
    this.gl.drawArrays(this.primitiveType, offset, this.vertCount);
  }

  /**@param {GameObject} other*/
  OnTriggerEnter(other) {}

  /**@param {GameObject} other*/
  OnCollisionEnter(other) {}
}

class Camera extends GameObject {
  constructor() {
    super();

    this.collisionType = collision.Sphere;
    this.circleCollider = 0.1;
    this.tag = "Player";

    this.shooting = false;
  }

  update() {
    if (_main.checkKey("A") || _main.checkKey("ARROWLEFT")) this.rot[1] -= 0.01;
    if (_main.checkKey("D") || _main.checkKey("ARROWRIGHT"))
      this.rot[1] += 0.01;
    if (_main.checkKey("Z") || _main.checkKey("ARROWUP")) this.rot[0] -= 0.01;
    if (_main.checkKey("X") || _main.checkKey("ARROWDOWN")) this.rot[0] += 0.01;

    this.velocity = [0, 0, 0];
    if (_main.checkKey("W")) {
      this.transform.doRotations(this.rot);
      for (let i = 0; i < 3; i++) {
        this.velocity[i] = this.transform.forward[i] * 0.01;
      }
    }
    if (_main.checkKey("S")) {
      this.transform.doRotations(this.rot);
      for (let i = 0; i < 3; i++) {
        this.velocity[i] = this.transform.forward[i] * -0.01;
      }
    }

    // Check if space bar is pressed and 30 frames have passed
    if (_main.checkKey(" ") && !this.shooting) {
      this.shooting = true;
      this.transform.doRotations(this.rot);
      let lil_infront = this.loc.map(
        (value, index) => value + this.transform.forward[index] / 5,
      );
      lil_infront[1] -= 0.1;

      _main.createObject(2, Bullet, lil_infront, this.rot, [0.01, 0.01, 0.01]);
    }

    if (!_main.checkKey(" ")) {
      this.shooting = false;
    }

    this.Move();
  }

  render(program) {
    let camLoc = gl.getUniformLocation(program, "cameraLoc");
    gl.uniform3fv(camLoc, new Float32Array(this.loc));
    let worldLoc = gl.getUniformLocation(program, "cameraRotation");
    gl.uniform3fv(worldLoc, new Float32Array(this.rot));
  }
}

class Asteroid extends GameObject {
  constructor() {
    super();
    this.collisionType = collision.Sphere;
    this.circleCollider = 1.1;
    this.tag = "Asteroid";
    this.health = 3;

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const A = [1, 0, 0]; //red
    const B = [0, 1, 0]; //red+green
    const C = [-1, 0, 0]; //green
    const D = [0, -1, 0]; //green+blue
    const E = [0, 0, 1]; // blue
    const F = [0, 0, -1]; // blue+ red
    const gray = [0.3, 0.3, 0.3];
    const black = [0, 0, 0];

    this.vertices = [
      ...E,
      ...black,
      ...C,
      ...gray,
      ...B,
      ...gray,
      ...F,
      ...black,
      ...A,
      ...gray,
      ...D,
      ...gray,
      ...F,
      ...black,
      ...C,
      ...gray,
      ...D,
      ...gray,
      ...E,
      ...black,
      ...A,
      ...gray,
      ...B,
      ...gray,
    ];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );
    this.scale = [1, 1, 1];

    this.vertCount = this.vertices.length / 6;
    this.primitiveType = gl.TRIANGLE_STRIP;
    this.angVelocity[0] = Math.floor(Math.random() * 500) / 1000;
    this.angVelocity[1] = Math.floor(Math.random() * 500) / 1000;
    this.angVelocity[2] = Math.floor(Math.random() * 500) / 1000;
  }

  update() {
    this.angVelocity = [1, 1, 1];
    this.checkHealth();
    this.Move();
  }

  checkHealth() {
    if (this.health <= 0) _main.destroyObject(this.id);
  }

  hit() {
    this.health--;
  }
}

class Bullet extends GameObject {
  constructor() {
    super();
    this.collisionType = collision.Sphere;
    this.circleCollider = 0.0;
    this.tag = "Bullet";

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.vertices = [
      -1, 0, 0, 1, 0.1, 0.1,

      0, 0, 1, 1, 0.1, 0.1,

      0, 0, -1, 1, 0.1, 0.1,

      -1, 0, 0, 1, 0.1, 0.1,

      0, -1, 0, 1, 0.1, 0.1,

      0, 1, 0, 1, 0.1, 0.1,
    ];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );

    this.primitiveType = gl.TRIANGLE_FAN;
    this.vertCount = this.vertices.length / 6;
    this.angVelocity = [0, 0, 0];
  }

  update() {
    if (
      Math.abs(this.loc[0]) > 50 ||
      Math.abs(this.loc[1]) > 50 ||
      Math.abs(this.loc[2]) > 50
    ) {
      _main.destroyObject(this.id);
    }

    this.transform.doRotations(this.rot);
    for (let i = 0; i < 3; i++) {
      this.velocity[i] = this.transform.forward[i] * 0.02;
    }
    this.Move();
  }

  OnCollisionEnter(other) {
    if (other.tag === "Asteroid") {
      other.hit();
      console.log(other.health);
      _main.destroyObject(this.id);
    }
  }
}
