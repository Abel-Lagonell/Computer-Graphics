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
  }

  update() {
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

    this.Move();
  }

  render(program) {
    let camLoc = gl.getUniformLocation(program, "cameraLoc");
    gl.uniform3fv(camLoc, new Float32Array(this.loc));
    let worldLoc = gl.getUniformLocation(program, "cameraRotation");
    gl.uniform3fv(worldLoc, new Float32Array(this.rot));
  }
}

class Floor extends GameObject {
  constructor() {
    super();
    this.tag = "Floor";

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const A = [1000, 0, 0];
    const B = [0, 0, 1000];
    const C = [-1000, 0, 0];
    const D = [0, 0, -1000];
    const color = hexToRGB("#ffd1dc");

    this.vertices = [
      ...A,
      ...color,
      ...B,
      ...color,
      ...C,
      ...color,
      ...D,
      ...color,
    ];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );

    this.vertCount = this.vertices.length / 6;
    this.primitiveType = gl.TRIANGLE_FAN;
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

class Cube extends GameObject {
  constructor() {
    super();
    this.collisionType = collision.Box;
    this.boxCollider = [0.6, 0.6, 0.6];
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.tag = "Cube";
    const color = hexToRGB("#F00");
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
      return [...value, ...color];
    });

    this.vertices = [];
    verts.map((value) => this.vertices.push(...value));
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );
    this.vertCount = this.vertices.length / 6;
    this.primitiveType = gl.TRIANGLE_STRIP;
    this.angVelocity = [0.001, 0.001, 0.001];
  }

  update() {}
}

class Prism extends GameObject {
  constructor() {
    super();
    this.tag = "Prism";
    this.collisionType = collision.Sphere;
    this.circleCollider = 0.6;
    this.primary = hexToRGB("#F00");
    this.secondary = hexToRGB("#0F0");
    this.initalize(3);
  }

  /** @param {number} sides */
  initalize(sides) {
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    let verts = nPrism(sides);
    this.vertices = [];
    verts.map((value, index) => {
      this.vertices.push(...value);
      this.vertices.push(...(index % 2 ? this.primary : this.secondary));
    });

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW,
    );
    this.vertCount = this.vertices.length / 6;
    this.primitiveType = gl.TRIANGLES;
  }

  update() {}
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

/**
 * @param {number} baseSides
 */
function nPrism(baseSides) {
  const vertices = [];

  // Generate vertices for the base of the prism
  const baseVertices = [];
  for (let i = 0; i < baseSides; i++) {
    const angle = (i / baseSides) * Math.PI * 2;
    const x = 0.5 * Math.cos(angle);
    const y = 0.5 * Math.sin(angle);
    const z = -0.5; // Base of the prism is at z = -0.5 (halfway down the cube)
    baseVertices.push([x, z, y]);
  }

  // Duplicate base vertices for the top face (height = 1, z = 0.5)
  const topVertices = baseVertices.map((vertex) => [vertex[0], 0.5, vertex[2]]);

  // Push base and top vertices to the final vertices array
  // vertices.push(...baseVertices, ...topVertices);

  // Generate side faces by connecting base and top vertices
  for (let i = 0; i < baseSides; i++) {
    const nextIndex = (i + 1) % baseSides; // Wrap around for the last vertex
    const baseVertex1 = baseVertices[i];
    const baseVertex2 = baseVertices[nextIndex];
    const topVertex1 = topVertices[i];
    const topVertex2 = topVertices[nextIndex];

    // Side face triangles
    vertices.push(baseVertex1, baseVertex2, topVertex1);
    vertices.push(baseVertex2, topVertex2, topVertex1);
  }

  for (let i = 0; i < topVertices.length; i++) {
    if (i === topVertices.length - 1) {
      vertices.push(topVertices[0], [0, 0.5, 0], topVertices[i]);
      continue;
    }

    vertices.push(topVertices[i], [0, 0.5, 0], topVertices[i + 1]);
  }

  for (let i = 0; i < baseVertices.length; i++) {
    if (i === baseVertices.length - 1) {
      vertices.push(baseVertices[0], [0, -0.5, 0], baseVertices[i]);
      continue;
    }

    vertices.push(baseVertices[i], [0, -0.5, 0], baseVertices[i + 1]);
  }

  return vertices;
}
