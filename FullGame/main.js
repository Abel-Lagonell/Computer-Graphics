const NUMBER_OF_LIGHTS = 10; //? If changed, change in two other places

class Main {
  constructor() {
    this.webGL = new I_WebGL();
    this.program = this.webGL.program;
    gl.useProgram(this.program);

    //Added these for Game Engine
    this.objectCount = 0;
    // @type {GameObject[]}
    this.visual = [];
    // @type {GameObject[]}
    this.solid = [];
    // @type {GameObject[]}
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

    let moonLoc = gl.getUniformLocation(this.program, "moonLoc");
    gl.uniform3fv(moonLoc, new Float32Array([0, 0, 20]));

    this.createObject(1, Camera);
    this.createObject(0, Ground, [-250, -0.5, -250]);
    this.createObject(1, BreakableCube, [0, 0, -2]);
    this.createObject(1, Cube, [0, 0, 5]);
    this.createObject(1, ChaseEnemy, [0, 0, 3]);
    this.createObjects();

    requestAnimationFrame(Main.mainLoop); //Static call
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (_main.gameState()) {
      _main.renderAll();
      _main.updateAll();
      requestAnimationFrame(Main.mainLoop);
    }
  }

  gameState() {
    if (_main.solid["ID0"].health > 0) {
      return true;
    }
    return false;
  }

  createObjects() {}

  assignLights() {
    let tags = [];
    for (let i in this.visual) {
      if (this.visual[i].tag === "") {
        tags.push(this.visual[i]);
      }
    }
    console.log(tags);

    const spotLoc = new Array(NUMBER_OF_LIGHTS);
    for (let j in tags) {
      spotLoc[j] = gl.getUniformLocation(this.program, "spotLoc[" + j + "]");
      gl.uniform3f(
        spotLoc[j],
        tags[j].loc[0],
        tags[j].loc[1] + 0.07,
        tags[j].loc[2],
      );
    }
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
  createObject(type, prefab, loc = [0, 0, 0], rot = [0, 0, 0], scale = [1]) {
    let temp = new prefab(); //Yes this dark sorcery will work.
    const id = "ID" + this.objectCount;
    this.objectCount++;
    temp.id = id;
    temp.prefab = prefab;
    for (let i = 0; i < 3; i++) {
      temp.loc[i] = loc[i];
      temp.rot[i] = rot[i];
      if (scale.length === 1) {
        temp.scale[i] *= scale[0];
      } else {
        temp.scale[i] *= scale[i];
      }
    }
    if (temp.tag === "Prism" || temp.tag === "Pyramid") {
      temp.circleCollider *= scale[0];
      console.log(temp.circleCollider);
    } else if (temp.circleCollider || temp.boxCollider) {
      if (scale.length === 1) {
        temp.circleCollider *= scale[0];
      } else {
        temp.boxCollider[0] *= scale[0];
        temp.boxCollider[1] *= scale[1];
        temp.boxCollider[2] *= scale[2];
      }
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

/**
 * Generate an array of random numbers within a specified range and precision, avoiding an exclusion range.
 * @param {number[]} range - An array [min, max] specifying the inclusive range of random numbers.
 * @param {number} precision - Number of decimal places to round each random number to.
 * @param {number} num - Number of random numbers to generate.
 * @param {number[]} exclusionRange - An array [excludeMin, excludeMax] specifying a range to avoid.
 * @returns {number[]} An array of random numbers.
 */
function randNum(range, precision, num, exclusionRange = []) {
  // Calculate the minimum and maximum values based on the range
  const min = range[0];
  const max = range[1];

  // Array to store the random numbers
  const randomNumbers = [];

  // Function to check if a number is within the exclusion range
  const isInExclusionRange = (number) => {
    if (exclusionRange.length === 2) {
      const excludeMin = exclusionRange[0];
      const excludeMax = exclusionRange[1];
      return number >= excludeMin && number <= excludeMax;
    }
    return false;
  };

  // Generate the specified number of random numbers
  while (randomNumbers.length < num) {
    // Generate a random number within the specified range
    const randomNumber = Math.random() * (max - min) + min;

    // Round the random number to the specified precision
    const roundedNumber = +randomNumber.toFixed(precision);

    // Check if the rounded number is not in the exclusion range
    if (!isInExclusionRange(roundedNumber)) {
      randomNumbers.push(roundedNumber);
    }
  }

  return randomNumbers;
}

/**
 * @param {string} hexString
 */
function hexToRGB(hexString) {
  // Remove '#' from the beginning of the string if present
  hexString = hexString.replace(/^#/, "");

  // Expand shorthand hex color (e.g., #FFF to #FFFFFF)
  if (hexString.length === 3) {
    hexString = hexString
      .split("")
      .map(function (c) {
        return c + c;
      })
      .join("");
  }

  // Convert hexadecimal to RGB
  var r = parseInt(hexString.substring(0, 2), 16) / 255.0;
  var g = parseInt(hexString.substring(2, 4), 16) / 255.0;
  var b = parseInt(hexString.substring(4, 6), 16) / 255.0;

  return [r, g, b];
}

function CreateCheckered(hexString) {
  let myPic = [];
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      if (i % 2 === j % 2) {
        myPic.push(...hexToRGB(hexString).map((value) => value * 255), 255);
      } else {
        myPic.push(0, 0, 0, 255);
      }
    }
  }
  return myPic;
}
