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

const gameObjects = Object.freeze({
  Nothing: 0,
  Cube: 1,
  BreakableCube: 2,
  EnemyX: 3,
  EnemyZ: 4,
  RandomEnemy: 5,
  ShootingEnemy: 6,
  ChaseEnemy: 7,
  Light: 8,
  Exit: 9,
});

class GameObject {
  constructor() {
    this.gl = gl;
    this.isTrigger = false;
    this.id = 0;

    this.picture = CreateCheckered("#F0F");

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
    this.faceCam = false;
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
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
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
    const faceCameLoc = this.gl.getUniformLocation(program, "FaceCam");
    this.gl.uniform3fv(tranLoc, new Float32Array(this.loc));
    this.gl.uniform3fv(thetaLoc, new Float32Array(this.rot));
    this.gl.uniform3fv(scaleLoc, new Float32Array(this.scale));
    this.gl.uniform1i(faceCameLoc, this.faceCam);

    offset = 0;
    this.gl.drawArrays(this.primitiveType, offset, this.vertCount);

    this.gl.uniform1i(faceCameLoc, false);
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
    this.exit = false;
  }

  update() {
    if (_main.checkKey("ARROWLEFT")) this.rot[1] -= 0.01;
    if (_main.checkKey("ARROWRIGHT")) this.rot[1] += 0.01;
    //if (_main.checkKey("ARROWUP")) this.rot[0] -= 0.01;
    //if (_main.checkKey("ARROWDOWN")) this.rot[0] += 0.01;
    if (_main.checkKey("R")) this.reset();

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

    //Shooting
    if (_main.checkKey(" ") && !this.shooting) {
      this.shooting = true;
      this.transform.doRotations(this.rot);

      let lilinfront = this.loc.map(
        (value, index) => value + this.transform.forward[index] / 5,
      );
      lilinfront[1] -= 0.2;

      _main.createObject(2, Bullet, lilinfront, this.rot, [0.1]);
    }

    if (!_main.checkKey(" ")) {
      this.shooting = false;
    }

    this.Move();
  }

  takeDmg() {
    this.health--;
  }

  render(program) {
    let camLoc = gl.getUniformLocation(program, "cameraLoc");
    gl.uniform3fv(camLoc, new Float32Array(this.loc));
    let camRot = gl.getUniformLocation(program, "cameraRotation");
    gl.uniform3fv(camRot, new Float32Array(this.rot));
  }

  reset() {
    this.loc = [0, 0, 0];
    this.rot = [0, 0, 0];
    this.exit = false;
    this.health = 5;
  }

  OnTriggerEnter(other) {
    if (other.tag === "Exit" && !this.exit) {
      this.exit = true;
      console.log("done");
    }
  }
}

class Ground extends GameObject {
  constructor() {
    super();
    this.tag = "Ground";
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.picture = floor;
    //prettier-ignore
    this.vertices = [
      0, 0, 0, 0, 0,
      1000, 0, 0,    500, 0,
      0, 0, 1000,  0,  500,
      1000, 0, 1000,   500,500,
    ]
    this.vertCount = this.vertices.length / 5;
    this.MyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      32,
      32,
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

class Plane extends GameObject {
  constructor() {
    super();

    this.collisionType = collision.Box;
    this.boxCollider = [1, 1, 1];
    this.faceCam = true;
    this.tag = "Plane";
    this.scale = [2, 2, 2];
  }

  initialize() {
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    //prettier-ignore
    this.vertices = [
      -0.5, -0.5, 0, 0, 1, 
      0.5, -0.5, 0, 1, 1, 
      -0.5, 0.5, 0, 0, 0, 
      0.5, 0.5, 0, 1, 0,
    ];
    this.vertCount = this.vertices.length / 5;
    this.primitiveType = gl.TRIANGLE_STRIP;
    this.MyTexture = gl.createTexture();
  }

  updateTexture() {
    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      32,
      32,
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
}

class Cube extends GameObject {
  constructor() {
    super();
    this.collisionType = collision.Box;
    this.boxCollider = [1.2, 1.2, 1.2];
    this.buffer = gl.createBuffer();
    this.scale = [2, 2, 2];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    this.tag = "Cube";
    this.primitiveType = gl.TRIANGLES;

    //Box Points
    const A = [-0.5, -0.5, 0.5]; //001
    const B = [-0.5, 0.5, -0.5]; //010
    const C = [-0.5, 0.5, 0.5]; //011
    const D = [0.5, -0.5, -0.5]; //100
    const E = [0.5, -0.5, 0.5]; //101
    const F = [0.5, 0.5, -0.5]; //110
    const G = [0.5, 0.5, 0.5]; //111
    const H = [-0.5, -0.5, -0.5]; //000

    //Texture Points
    const T = [0, 0];
    const Y = [0, 2];
    const U = [2, 0];
    const I = [2, 2];

    //prettier-ignore
    let verts = [
      A, B, C, A, B, H,//Left
      A, C, E, G, C, E,//Back
      A, D, E, A, H, D,//Bottom
      F, B, C, F, G, C,//Top
      F, G, E, F, D, E,//Back
      F, D, H, F, B, H,//Front

    ];

    //prettier-ignore
    let uv = [
      T, I, U, T, I, Y, //Left
      T, Y, U, I, Y, U, //Back
      T, I, U, T, Y, I, //Bottom
      T, U, I, T, Y, I, //Top
      Y, T, U, Y, I, U, //Right
      Y, T, U, Y, I, U, //Front
    ];

    this.vertices = [];
    verts.map((value, index) => {
      this.vertices.push(...value, ...uv[index]);
    });

    this.picture = wall;
    this.MyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);
    //We only want to do this once.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      32,
      32,
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
}

class BreakableCube extends Cube {
  constructor() {
    super();
    this.tag = "BreakableCube";

    this.picture = crate;
    this.MyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);
    //We only want to do this once.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      32,
      32,
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
}

class Bullet extends Plane {
  constructor() {
    super();
    this.collisionType = collision.Sphere;
    this.circleCollider = 1;
    this.picture = brick;
    this.speed = 0.00025;
    this.tag = "Bullet";
    this.initialize();
    this.updateTexture();
    this.audio = new Audio("./src/BrickHit.mp3");
    this.distToPlayer;
  }

  getVolume() {
    let distance = this.distToPlayer < 8 ? this.distToPlayer : 0;
    let percentage = 1 - distance / 10;
    this.audio.volume = distance === 0 ? 0 : percentage;
  }

  calcDistanceToPlayer() {
    const player = _main.solid["ID0"];

    this.distToPlayer = Math.sqrt(
      (player.loc[0] - this.loc[0]) * (player.loc[0] - this.loc[0]) +
        (player.loc[1] - this.loc[1]) * (player.loc[1] - this.loc[1]) +
        (player.loc[2] - this.loc[2]) * (player.loc[2] - this.loc[2]),
    );
  }

  update() {
    this.calcDistanceToPlayer();
    this.transform.doRotations(this.rot);
    for (let i = 0; i < 3; i++) {
      this.velocity[i] += this.transform.forward[i] * this.speed;
    }
    this.Move();
  }

  initialize() {
    super.initialize();
    this.active = false;
  }

  /**
   * @param {GameObject} other
   */
  OnCollisionEnter(other) {
    switch (other.tag) {
      case "BreakableCube":
        _main.destroyObject(other.id);
        break;
      case "Enemy":
      case "ChaseEnemy":
        other.takeDmg();
        break;
      default:
        break;
    }
    this.getVolume();
    this.audio.play();
    _main.destroyObject(this.id);
  }
}

class EnemyBullet extends Bullet {
  constructor() {
    super();
    this.picture = orb;
    this.initialize();
    this.updateTexture();
    this.speed = 0.0001;
    this.tag = "EnemyBullet";
    this.audio = new Audio("./src/Ouch.mp3");
  }

  OnCollisionEnter(other) {
    switch (other.tag) {
      case "Player":
        this.audio.play();
        other.takeDmg();
        break;
      default:
        break;
    }
    _main.destroyObject(this.id);
  }
}

class Enemy extends Plane {
  constructor() {
    super();
    this.tag = "Enemy";
    this.health = 3;
    this.picture = ghostWalk1;
    this.velocity = [0, 0, 0.005];
    this.initialize();
    this.updateTexture();
    this.destroy = false;
    this.walkCycle = [
      ghostWalk1,
      ghostWalk2,
      ghostWalk3,
      ghostWalk4,
      ghostWalk5,
      ghostWalk6,
    ];
    this.audio = new Audio("./src/Explosion.mp3");
    this.audio2 = new Audio("./src/Ouch.mp3");
  }

  getVolume() {
    let distance = this.distToPlayer < 8 ? this.distToPlayer : 0;
    let percentage = 1 - distance / 10;

    let volume = distance === 0 ? 0 : percentage;
    this.audio.volume = volume;
    return volume;
  }

  initialize() {
    super.initialize();

    this.explosionCycle = [Explosion1, Explosion2, Explosion3, Explosion4];
    this.distToPlayer = 0;
    this.boxCollider = [0.2, 0.2, 0.2];
    this.currentSprite = 0;
    this.frameDuration = 30;
    this.currentFrame = 10;
  }

  takeDmg() {
    this.health--;
  }

  checkHealth() {
    if (this.health <= 0) {
      if (!this.destroy) {
        this.currentSprite = 0;
        this.destroy = true;
      }
      this.getVolume();
      this.audio.play();
      this.playExplosion();
    } else {
      this.changeTextures();
      this.Move();
    }
  }

  OnCollisionEnter(other) {
    switch (other.tag) {
      case "Player":
        this.audio2.volume = 0.7;
        this.audio2.play();
        for (let i = 0; i < 5; i++) other.takeDmg();
        break;
      case "Cube":
      case "BreakableCube":
        this.changeVelocity();
      default:
        break;
    }
  }

  calcDistanceToPlayer() {
    const player = _main.solid["ID0"];

    this.distToPlayer = Math.sqrt(
      (player.loc[0] - this.loc[0]) * (player.loc[0] - this.loc[0]) +
        (player.loc[1] - this.loc[1]) * (player.loc[1] - this.loc[1]) +
        (player.loc[2] - this.loc[2]) * (player.loc[2] - this.loc[2]),
    );
  }

  changeTextures() {
    if (this.currentFrame > 0) {
      this.currentFrame--;
      return;
    }
    this.currentFrame = this.frameDuration;

    if (this.currentSprite > this.walkCycle.length) this.currentSprite = 0;

    this.picture = this.walkCycle[this.currentSprite];

    this.updateTexture();
    this.currentSprite++;
  }

  changeVelocity() {
    this.velocity = this.velocity.map((value) => -value);
  }

  playExplosion() {
    if (this.currentFrame > 0) {
      this.currentFrame--;
      return;
    }

    this.currentFrame = this.frameDuration;
    this.picture = this.explosionCycle[this.currentSprite];

    this.updateTexture();
    this.currentSprite++;

    if (this.currentSprite >= this.explosionCycle.length) {
      _main.destroyObject(this.id);
    }
  }

  update() {
    this.checkHealth();
    this.calcDistanceToPlayer();
  }
}

class EnemyX extends Enemy {
  constructor() {
    super();
    this.velocity = [0.005, 0, 0];
  }
}

class RandomEnemy extends Enemy {
  constructor() {
    super();
    this.picture = MiniSkeletonMan5;
    this.velocityxz = randNum([-1, 1], 2, 2).map((value) => value / 100);
    this.velocity = [this.velocityxz[0], 0, this.velocityxz[1]];
    this.initialize();
    this.updateTexture();
    this.health = 2;
    this.walkCycle = [
      MiniSkeletonMan5,
      MiniSkeletonMan6,
      MiniSkeletonMan7,
      MiniSkeletonMan8,
      MiniSkeletonMan9,
      MiniSkeletonMan10,
    ];
  }

  changeVelocity() {
    this.velocityxz = randNum([-1, 1], 2, 2).map((value) => value / 100);
    this.velocity = [this.velocityxz[0], 0, this.velocityxz[1]];
  }
}

class ChaseEnemy extends Enemy {
  constructor() {
    super();
    this.health = 2;
    this.distToPlayer = 0;
    this.picture = MiniZombieMan1;
    this.initialize();
    this.updateTexture();
    this.walkCycle = [
      MiniZombieMan1,
      MiniZombieMan2,
      MiniZombieMan3,
      MiniZombieMan4,
      MiniZombieMan5,
      MiniZombieMan6,
    ];
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

  changeVelocity() {}

  update() {
    this.checkHealth();
    this.lookAtPlayer();
    this.transform.doRotations(this.rot);
    for (let i = 0; i < 3; i++) {
      this.velocity[i] = this.transform.forward[i] * 0.0035;
    }
    if (this.distToPlayer < 0.4) {
      this.velocity = [0, 0, 0];
    }
  }
}

class ShootingEnemy extends ChaseEnemy {
  constructor() {
    super();
    this.health = 5;
    this.picture = MiniLich1;
    this.initialize();
    this.updateTexture();
    this.walkCycle = [
      MiniLich1,
      MiniLich2,
      MiniLich3,
      MiniLich4,
      MiniLich5,
      MiniLich6,
    ];
    this.timer = 240;
    this.orb = new Audio("./src/Orb.mp3");
  }

  update() {
    this.checkHealth();
    this.lookAtPlayer();
    this.tryShoot();

    this.transform.doRotations(this.rot);
    for (let i = 0; i < 3; i++) {
      this.velocity[i] = this.transform.forward[i] * -0.005;
    }
    if (this.distToPlayer > 4) {
      this.velocity = [0, 0, 0];
    }
    this.Move();
  }

  tryShoot() {
    if (this.timer !== 0) {
      this.timer--;
      return;
    }

    this.timer = 240;
    this.transform.doRotations(this.rot);

    let lilinfront = this.loc.map(
      (value, index) => value + this.transform.forward[index] / 2,
    );
    lilinfront[1] -= 0.1;
    this.orb.volume = this.getVolume();
    this.orb.play();
    _main.createObject(2, EnemyBullet, lilinfront, this.rot, [0.25]);
  }
}

class Exit extends Cube {
  constructor() {
    super();
    this.tag = "Exit";
    this.scale = [0.5, 0.5, 0.5];

    this.picture = CreateMono("#005F00");
    this.MyTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.MyTexture);
    //We only want to do this once.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      2,
      2,
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

    this.speed = 0.0002;
    this.angVelocity = [0, 0.002, 0];
  }

  update() {
    if (Math.abs(this.loc[1]) >= 0.1) this.speed = -this.speed;
    this.velocity[1] = this.speed / (Math.abs(this.loc[1]) + 1);
    this.Move();
  }
}

class Light extends Plane {
  constructor() {
    super();
    this.tag = "Light";
    this.picture = fairy;
    this.scale = [0.4, 0.4, 0.4];
    this.initialize();
    this.updateTexture();
  }

  update() {}
}
