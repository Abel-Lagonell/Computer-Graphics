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

    this.picture = CreateCheckered();

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
    //First we bind the buffer for triangle 1
    let positionAttributeLocation = this.gl.getAttribLocation(
      program,
      "a_position",
    );
    let size = 3; // 2 components per iteration
    let type = this.gl.FLOAT; // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 5 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element     // 0 = move forward size * sizeof(type) each iteration to get the next position
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

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!TEXTURE CHANGE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //Now we have to do this for color
    var TexAttributeLocation = gl.getAttribLocation(program, "texcord");
    //We don't have to bind because we already have the correct buffer bound.
    size = 2;
    type = gl.FLOAT;
    normalize = false;
    stride = 5 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element
    offset = 3 * Float32Array.BYTES_PER_ELEMENT; //size of the offset
    gl.enableVertexAttribArray(TexAttributeLocation);
    gl.vertexAttribPointer(
      TexAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);
    //setup S
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); //gl.MIRRORED_REPEAT//gl.CLAMP_TO_EDGE
    //Sets up our T
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); //gl.MIRRORED_REPEAT//gl.CLAMP_TO_EDGE
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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

    this.interval = 60;

    this.collisionType = collision.Sphere;
    this.circleCollider = 0.1;
    this.tag = "Player";
    this.shooting = false;
    this.health = 5;
    this.timer = this.interval;
    this.healthTake = false;
  }

  update() {
    if (this.timer > 0) this.timer--;

    if (_main.checkKey("ARROWLEFT")) this.rot[1] -= 0.01;
    if (_main.checkKey("ARROWRIGHT")) this.rot[1] += 0.01;
    if (_main.checkKey("ARROWUP")) this.rot[0] -= 0.01;
    if (_main.checkKey("ARROWDOWN")) this.rot[0] += 0.01;

    if (this.rot[0] <= -1) this.rot[0] = -1;
    if (this.rot[0] >= 1) this.rot[0] = 1;

    this.velocity = [0, 0, 0];
    if (_main.checkKey("W")) {
      this.transform.doRotations(this.rot);
      for (let i = 0; i < 3; i += 2) {
        this.velocity[i] += this.transform.forward[i] * 0.01;
      }
    }
    if (_main.checkKey("S")) {
      this.transform.doRotations(this.rot);
      for (let i = 0; i < 3; i += 2) {
        this.velocity[i] += this.transform.forward[i] * -0.01;
      }
    }
    if (_main.checkKey("A")) {
      this.transform.doRotations(this.rot);
      for (let i = 0; i < 3; i++) {
        this.velocity[i] += this.transform.right[i] * -0.01;
      }
    }
    if (_main.checkKey("D")) {
      this.transform.doRotations(this.rot);
      for (let i = 0; i < 3; i++) {
        this.velocity[i] += this.transform.right[i] * 0.01;
      }
    }

    if (_main.checkKey(" ") && !this.shooting) {
      this.shooting = true;
      this.transform.doRotations(this.rot);

      let lilinfront = this.loc.map(
        (value, index) => value + this.transform.forward[index] / 5,
      );
      lilinfront[1] -= 0.2;

      _main.createObject(2, Bullet, lilinfront, this.rot, [0.01]);
    }

    if (!_main.checkKey(" ")) {
      this.shooting = false;
    }

    this.Move();
  }

  takeDmg() {
    if (!this.healthTake && this.timer === 0) {
      this.health--;
      this.timer = this.interval;
    }
  }

  render(program) {
    let camLoc = gl.getUniformLocation(program, "cameraLoc");
    gl.uniform3fv(camLoc, new Float32Array(this.loc));
    let worldLoc = gl.getUniformLocation(program, "cameraRotation");
    gl.uniform3fv(worldLoc, new Float32Array(this.rot));
  }
}

class Ground extends GameObject {
  constructor() {
    super();
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.MyPicture = CreateCheckered();
    //prettier-ignore
    this.vertices = [
      0, 0, 0, 0, 0,
      1000, 0, 0,    100, 0,
      0, 0, 1000,  0,  100,
      1000, 0, 1000,   100,100,
    ]
    this.vertCount = this.vertices.length / 5;
    this.MyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      16,
      16,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(this.MyPicture),
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );
  }
  update() {}
}

class Icosohedron extends GameObject {
  constructor() {
    super();

    this.tag = "Sphere";

    this.collisionType = collision.Sphere;
    this.circleCollider = 1;
    this.primary = hexToRGB("#000");
    this.secondary = hexToRGB("#000");
    this.tertiary = hexToRGB("#000");

    this.angVelocity = [0.0, 0.001, 0.001];
  }

  makeVerts() {
    /** @type number[][]*/
    const vertArray = createIcosahedronVertices();
    let verts = vertArray.map((value) => {
      switch (Math.floor(Math.random() * 10) % 3) {
        case 0:
          return [...value, ...this.primary];
        case 1:
          return [...value, ...this.secondary];
        case 2:
          return [...value, ...this.tertiary];
      }
    });
    let vert = [];
    verts.map((value) => value.map((value) => vert.push(value)));
    return vert;
  }

  initalize() {
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    this.vertices = this.makeVerts();

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );

    this.vertCount = this.vertices.length / 6;
    this.primitiveType = gl.TRIANGLE_STRIP;
  }
}

class Plane extends GameObject {
  constructor() {
    super();

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.tag = "Plane";
    //prettier-ignore
    this.vertices = [
      -1, -1, 0, 0, 1, 
      1, -1, 0, 1, 1, 
      -1, 1, 0, 0, 0, 
      1, 1, 0, 1, 0,
    ];
    this.vertCount = this.vertices.length / 5;
    this.primitiveType = gl.TRIANGLE_STRIP;
    this.MyTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      16,
      16,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(this.picture),
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );
  }

  update() {}
}

class Cube extends GameObject {
  constructor() {
    super();
    this.collisionType = collision.Box;
    this.boxCollider = [0.6, 0.6, 0.6];
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.tag = "Cube";
    this.primitiveType = gl.TRIANGLE_STRIP;

    const A = [-0.5, -0.5, 0.5];
    const B = [-0.5, 0.5, -0.5];
    const C = [-0.5, 0.5, 0.5];
    const D = [0.5, -0.5, -0.5];
    const E = [0.5, -0.5, 0.5];
    const F = [0.5, 0.5, -0.5];
    const G = [0.5, 0.5, 0.5];
    const H = [-0.5, -0.5, -0.5];

    //prettier-ignore
    let verts = [
      G, F, E,
      D, A, E,
      C, G, B, 
      C, H, A, 
      D, H, F,
      B, G
    ];

    verts = verts.map((value) => {
      if (value === A || value === F) return [...value, 0, 0];
      else if (value === H || value === G) return [...value, 0, 100];
      else if (value === C || value === D) return [...value, 100, 0];
      else if (value === B || value === E) return [...value, 100, 100];
    });

    this.vertices = [];
    verts.map((value) => this.vertices.push(...value));

    this.MyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);
    //We only want to do this once.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      16,
      16,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(this.picture),
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );
    this.vertCount = this.vertices.length / 5;
  }

  update() {}

  render(program) {
    //First we bind the buffer for triangle 1
    let positionAttributeLocation = this.gl.getAttribLocation(
      program,
      "a_position",
    );
    let size = 3; // 2 components per iteration
    let type = this.gl.FLOAT; // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 5 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element     // 0 = move forward size * sizeof(type) each iteration to get the next position
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

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!TEXTURE CHANGE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //Now we have to do this for color
    var TexAttributeLocation = gl.getAttribLocation(program, "texcord");
    //We don't have to bind because we already have the correct buffer bound.
    size = 2;
    type = gl.FLOAT;
    normalize = false;
    stride = 5 * Float32Array.BYTES_PER_ELEMENT; //Size in bytes of each element
    offset = 3 * Float32Array.BYTES_PER_ELEMENT; //size of the offset
    gl.enableVertexAttribArray(TexAttributeLocation);
    gl.vertexAttribPointer(
      TexAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset,
    );

    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);
    //setup S
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); //gl.MIRRORED_REPEAT//gl.CLAMP_TO_EDGE
    //Sets up our T
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); //gl.MIRRORED_REPEAT//gl.CLAMP_TO_EDGE
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    const tranLoc = this.gl.getUniformLocation(program, "u_transform");
    const thetaLoc = this.gl.getUniformLocation(program, "u_rotation");
    const scaleLoc = this.gl.getUniformLocation(program, "u_scale");
    this.gl.uniform3fv(tranLoc, new Float32Array(this.loc));
    this.gl.uniform3fv(thetaLoc, new Float32Array(this.rot));
    this.gl.uniform3fv(scaleLoc, new Float32Array(this.scale));

    offset = 0;
    this.gl.drawArrays(this.primitiveType, offset, this.vertCount);
  }
}

class Bullet extends Icosohedron {
  constructor() {
    super();
    this.primary = hexToRGB("#700");
    this.secondary = hexToRGB("#500");
    this.tertiary = hexToRGB("#900");
    this.initalize();

    this.angVelocity = [0, 0, 0];
  }

  update() {
    this.transform.doRotations(this.rot);
    for (let i = 0; i < 3; i++) {
      this.velocity[i] += this.transform.forward[i] * 0.0001;
    }

    this.Move();
  }

  /**
   * @param {GameObject} other
   */
  OnCollisionEnter(other) {
    switch (other.tag) {
      case "Floor":
      case "Cube":
        _main.destroyObject(this.id);
        break;
      case "BreakableCube":
        _main.destroyObject(other.id);
        _main.destroyObject(this.id);
        break;
      case "Enemy":
        other.takeDmg();
        _main.destroyObject(this.id);
        break;
      default:
        break;
    }
  }
}

class Enemy extends Cube {
  constructor() {
    super();
    this.tag = "Enemy";
    this.scale = [0.5, 1, 0.5];
    this.boxCollider = [0.3, 0.6, 0.3];
    this.color = hexToRGB("#303");
    this.health = 3;
    this.distToPlayer = 0;
    this.initalize();
  }

  lookAtPlayer() {
    const player = _main.solid["ID0"];

    const dirVector = [
      player.loc[0] - this.loc[0],
      player.loc[1] - this.loc[1],
      player.loc[2] - this.loc[2],
    ];

    const magnitude = Math.sqrt(
      dirVector
        .map((value) => value * value)
        .reduce((total, current) => (total += current)),
    );
    this.distToPlayer = magnitude;
    const normalDirVector = dirVector.map((value) => value / magnitude);
    this.rot[1] = Math.atan2(normalDirVector[0], normalDirVector[2]);
  }

  takeDmg() {
    this.health--;
  }

  update() {
    if (this.health <= 0) {
      _main.destroyObject(this.id);
    }
    this.lookAtPlayer();
    this.transform.doRotations(this.rot);
    for (let i = 0; i < 3; i++) {
      this.velocity[i] = this.transform.forward[i] * 0.005;
    }
    if (this.distToPlayer < 0.4) {
      this.velocity = [0, 0, 0];
    }
    this.Move();
  }

  OnCollisionEnter(other) {
    if (other.tag === "Player") {
      other.takeDmg();
    }
  }
}

/**
 * @return {number[][]}
 */
function createIcosahedronVertices() {
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio

  // Define the vertices of a regular icosahedron
  let B = [0, 1, phi]; // A -> B
  let C = [0, -1, phi]; // C CORRECT
  let I = [0, -1, -phi]; //? D -> I
  let H = [0, 1, -phi]; //? B -> H
  let F = [1, phi, 0]; // E -> F
  let D = [1, -phi, 0]; // F -> D
  let G = [-1, phi, 0]; //? G CORRECT
  let J = [-1, -phi, 0]; //? H -> J
  let A = [phi, 0, 1]; //* J -> A
  let E = [phi, 0, -1]; // I -> E
  let K = [-phi, 0, 1]; //? K CORRECT
  let M = [-phi, 0, -1]; // M

  //prettier-ignore
  let vertices = [
    M, K, G,
    B, K, C,
    B, A, C,
    D, J, C,
    K, J, M,
    I, J, D,
    I, E, D,
    A, E, F,
    H, E, I,
    H, M, G,
    H, G, G,
    B, F, A,
    F, G, H,
  ];
  // Normalize the vertices to the given radius */
  for (let i = 0; i < vertices.length; i++) {
    const length = Math.sqrt(
      vertices[i][0] ** 2 + vertices[i][1] ** 2 + vertices[i][2] ** 2,
    );
    vertices[i][0] = vertices[i][0] / length;
    vertices[i][1] = vertices[i][1] / length;
    vertices[i][2] = vertices[i][2] / length;
  }

  return vertices;
}
