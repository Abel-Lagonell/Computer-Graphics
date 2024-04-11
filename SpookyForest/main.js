class Main {
  constructor() {
    this.webGL = new I_WebGL();
    this.program = this.webGL.program;
    requestAnimationFrame(Main.mainLoop); //Static call

    //Added these for Game Engine
    this.objectCount = 0;
    this.visual = [];
    this.solid = [];
    this.trigger = [];
    this.keys = [];

    //Added for Camera move!
    let camLoc = gl.getUniformLocation(this.program, "cameraLoc");
    gl.uniform3fv(camLoc, new Float32Array([0, 0, 0]));
    let worldLoc = gl.getUniformLocation(this.program, "cameraRotation");
    gl.uniform3fv(worldLoc, new Float32Array([0, 0, 0]));

    let tempLoc = gl.getUniformLocation(this.program, "n");
    gl.uniform1f(tempLoc, 0.1);
    tempLoc = gl.getUniformLocation(this.program, "f");
    gl.uniform1f(tempLoc, 500);
    tempLoc = gl.getUniformLocation(this.program, "r");
    gl.uniform1f(tempLoc, 0.1);
    tempLoc = gl.getUniformLocation(this.program, "t");
    gl.uniform1f(tempLoc, 0.1);

    this.createObject(1, Camera);
    //this.createObject(0, Floor, [0, -0.1, 0], [0, 0, 0], [10, 10, 10]);
    this.createObject(0, TreeLeaves, [0, 0, 2], [0, 0, 0], [0.5, 0.5, 0.5]);
  }

  /** @param {KeyboardEvent} event */
  static keyD(event) {
    _main.keyDown(event);
  }

  /** @param {KeyboardEvent} event */
  static keyU(event) {
    _main.keyUp(event);
  }

  static mainLoop() {
    _main.updateAll();
    _main.renderAll();
    requestAnimationFrame(Main.mainLoop);
  }

  updateAll() {
    for (let i in this.visual) {
      this.visual[i].update();
    }
    for (let i in this.solid) {
      this.solid[i].update();
    }
    for (let i in this.trigger) {
      this.trigger[i].update();
    }
  }

  renderAll() {
    for (let i in this.visual) {
      this.visual[i].render(this.program);
    }
    for (let i in this.solid) {
      this.solid[i].render(this.program);
    }
    for (let i in this.trigger) {
      this.trigger[i].render(this.program);
    }
  }

  /** @param {KeyboardEvent} event */
  keyDown(event) {
    this.keys[event.key.toUpperCase()] = true;
  }

  /** @param {KeyboardEvent} event */
  keyUp(event) {
    this.keys[event.key.toUpperCase()] = false;
  }

  /**
   * @param {number[]} point1
   * @param {number[]} point2
   */
  calculateDistance(point1, point2) {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    const dz = point2[2] - point1[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * @param {number[]} proposedLocation
   * @param {GameObject} self
   * @param {GameObject} other
   */
  checkCollision(proposedLocation, self, other) {
    if (
      other.collisionType === collision.undefined ||
      self.collisionType === collision.undefined
    ) {
      console.error("Collision type is missing");
    } else if (
      other.collisionType === collision.Sphere &&
      self.collisionType === collision.Sphere
    ) {
      if (other.circleCollider < 0 || self.circleCollider < 0) {
        console.error("Collision Radius is negative");
        return false;
      }
      let distance = this.calculateDistance(proposedLocation, other.loc);
      return distance < self.circleCollider + other.circleCollider;
    } else if (
      other.collisionType === collision.Sphere &&
      self.collisionType === collision.Box
    ) {
      if (other.circleCollider < 0 || self.circleCollider < 0) {
        console.error("Collision Radius is negative");
        return false;
      }
      //? Further testing is needed
      const x_bounds = [
        proposedLocation[0] - self.boxCollider[0],
        proposedLocation[0] + self.boxCollider[0],
      ];
      const y_bounds = [
        proposedLocation[1] - self.boxCollider[1],
        proposedLocation[1] + self.boxCollider[1],
      ];
      const z_bounds = [
        proposedLocation[2] - self.boxCollider[2],
        proposedLocation[2] + self.boxCollider[2],
      ];

      return (
        other.loc[0] + other.circleCollider < x_bounds[1] &&
        other.loc[0] + other.circleCollider < x_bounds[0] &&
        other.loc[1] + other.circleCollider < y_bounds[1] &&
        other.loc[1] + other.circleCollider < y_bounds[0] &&
        other.loc[2] + other.circleCollider < z_bounds[1] &&
        other.loc[2] + other.circleCollider < z_bounds[0]
      );
    } else if (
      other.collisionType === collision.Box &&
      self.collisionType === collision.Sphere
    ) {
      if (other.circleCollider < 0 || self.circleCollider < 0) {
        console.error("Collision Radius is negative");
        return false;
      }
      const x_bounds = [
        other.loc[0] - other.boxCollider[0],
        other.loc[0] + other.boxCollider[0],
      ];
      const y_bounds = [
        other.loc[1] - other.boxCollider[1],
        other.loc[1] + other.boxCollider[1],
      ];
      const z_bounds = [
        other.loc[2] - other.boxCollider[2],
        other.loc[2] + other.boxCollider[2],
      ];

      return (
        proposedLocation[0] - self.circleCollider < x_bounds[1] &&
        proposedLocation[0] + self.circleCollider > x_bounds[0] &&
        proposedLocation[1] - self.circleCollider < y_bounds[1] &&
        proposedLocation[1] + self.circleCollider > y_bounds[0] &&
        proposedLocation[2] - self.circleCollider < z_bounds[1] &&
        proposedLocation[2] + self.circleCollider > z_bounds[0]
      );
    } else if (
      other.collisionType === collision.Box &&
      self.collisionType === collision.Box
    ) {
      const otherX_bounds = [
          other.loc[0] - other.boxCollider[0],
          other.loc[0] + other.boxCollider[0],
        ],
        otherY_bounds = [
          other.loc[1] - other.boxCollider[1],
          other.loc[1] + other.boxCollider[1],
        ],
        otherZ_bounds = [
          other.loc[2] - other.boxCollider[2],
          other.loc[2] + other.boxCollider[2],
        ],
        selfX_bounds = [
          proposedLocation[0] - self.boxCollider[0],
          proposedLocation[0] + self.boxCollider[0],
        ],
        selfY_bounds = [
          proposedLocation[1] - self.boxCollider[1],
          proposedLocation[1] + self.boxCollider[1],
        ],
        selfZ_bounds = [
          proposedLocation[2] - self.boxCollider[2],
          proposedLocation[2] + self.boxCollider[2],
        ];

      return (
        otherX_bounds[0] < selfX_bounds[1] &&
        otherY_bounds[0] < selfY_bounds[1] &&
        otherZ_bounds[0] < selfZ_bounds[1] &&
        otherX_bounds[1] > selfX_bounds[0] &&
        otherY_bounds[1] > selfY_bounds[0] &&
        otherZ_bounds[1] > selfZ_bounds[0]
      );
    }

    return false;
  }

  /**
   * @param {number} type 0->V 1->S 2->T
   * @param {GameObject} prefab
   * @param {number[]} loc
   * @param {number[]} rot
   * @param {number[]} scale
   */
  createObject(
    type,
    prefab,
    loc = [0, 0, 0],
    rot = [0, 0, 0],
    scale = [1, 1, 1],
  ) {
    let temp = new prefab(); //Yes this dark sorcery will work.
    const id = "ID" + this.objectCount;
    this.objectCount++;
    temp.id = id;
    temp.prefab = prefab;
    for (let i = 0; i < 3; i++) {
      temp.loc[i] = loc[i];
      temp.rot[i] = rot[i];
      temp.scale[i] *= scale[i];
    }
    if (scale[0] === scale[1] && scale[1] === scale[2]) {
      temp.circleCollider *= scale[0];
    } else {
      temp.boxCollider[0] *= scale[0];
      temp.boxCollider[1] *= scale[1];
      temp.boxCollider[2] *= scale[2];
    }
    switch (type) {
      case 0:
        this.visual[id] = temp;
        break;
      case 1:
        this.solid[id] = temp;
        break;
      case 2:
        this.trigger[id] = temp;
        break;
      default:
        break;
    }
    return temp;
  }

  /** @param {string} id */
  destroyObject(id) {
    if (id in this.visual) {
      delete this.visual[id];
      return true;
    }
    if (id in this.solid) {
      delete this.solid[id];
      return true;
    }

    if (id in this.trigger) {
      delete this.trigger[id];
      return true;
    }
    return false;
  }

  /** @param {string} key */
  checkKey(key) {
    return !!(key in this.keys && this.keys[key]);
  }
}
