//@ts-check
class Main {
  constructor() {
    this.Keys = [];
    this.myWEBGL = new I_WebGL();
    this.program = this.myWEBGL.program;
    /** @type {GameObject[]} */
    this.Visual = [];
    /** @type {GameObject[]} */
    this.Solid = [];
    /** @type {GameObject[]} */
    this.Trigger = [];
    this.ObjectCounter = 0;
    this.score = 0;
    this.scoreText = document.getElementById("score");
    this.gameContinue = true;

    this.CreateObject(1, MainCharacter, [0, 0, 0], [0, 0, 0], undefined);
    this.makeWalls();
    this.makeCoins();
    this.makeEnemies();
  }

  static keyD(event) {
    m.KeyDown(event);
  }

  static keyU(event) {
    m.keyUp(event);
  }

  static mouseH(event) {
    m.MouseClick(event);
  }

  static MainLoop() {
    m.UpdateAll();
    m.RenderAll();
    m.gameContinue ? requestAnimationFrame(Main.MainLoop) : m.gameEnd();
  }

  makeWalls() {
    const rot = [0, 0, 0];
    //Outer Walls
    this.CreateObject(1, Walls, [0, 1, 0], rot, [10, 0.5, 1]);
    this.CreateObject(1, Walls, [0, -1, 0], rot, [10, 0.5, 1]);
    this.CreateObject(1, Walls, [1, 0, 0], rot, [0.5, 10, 1]);
    this.CreateObject(1, Walls, [-1, 0, 0], rot, [0.5, 10, 1]);

    //Inner Walls
    //Vert
    this.CreateObject(1, Walls, [0.7, 0.6, 0], rot, [0.25, 6, 1]);
    this.CreateObject(1, Walls, [-0.7, 0.5, 0], rot, [0.25, 4.5, 1]);
    this.CreateObject(1, Walls, [0.425, 0.25, 0], rot, [0.25, 4.5, 1]);
    this.CreateObject(1, Walls, [-0.425, -0.25, 0], rot, [0.25, 4.5, 1]);
    this.CreateObject(1, Walls, [-0.7, -0.475, 0], rot, [0.25, 2.5, 1]);
    this.CreateObject(1, Walls, [0.7, -0.7, 0], rot, [0.25, 2.5, 1]);
    //Horizontal
    this.CreateObject(1, Walls, [0, 0.7, 0], rot, [4.5, 0.25, 1]);
    this.CreateObject(1, Walls, [0, -0.7, 0], rot, [4.5, 0.25, 1]);
    this.CreateObject(1, Walls, [-0.25, 0.425, 0], rot, [4.5, 0.25, 1]);
    this.CreateObject(1, Walls, [0.275, -0.425, 0], rot, [4.5, 0.25, 1]);
    this.CreateObject(1, Walls, [0.7, -0.2, 0], rot, [3, 0.25, 1]);
    this.CreateObject(1, Walls, [-0.85, -0.5, 0], rot, [1.5, 0.25, 1]);
  }

  makeCoins() {
    let rot = [0, 0, 0];
    this.CreateObject(2, Coin, [0, -0.85, 0], rot, undefined);
    this.CreateObject(2, Coin, [0, 0.85, 0], rot, undefined);
    this.CreateObject(2, Coin, [0.845, 0.85, 0], rot, undefined);
    this.CreateObject(2, Coin, [0.845, -0.85, 0], rot, undefined);
    this.CreateObject(2, Coin, [-0.845, -0.85, 0], rot, undefined);
    this.CreateObject(2, Coin, [-0.845, 0.85, 0], rot, undefined);
  }

  makeEnemies() {
    let horizontal = [0, 0, Math.PI / 2];
    let vertical = [0, 0, 0];
    this.CreateObject(1, Enemy, [0.85, 0.5, 0], vertical, undefined);
    //this.CreateObject(1, Enemy, [-0.57, -0.5, 0], vertical, undefined);
    //this.CreateObject(1, Enemy, [-0.2, 0.55, 0], horizontal, undefined);
    //this.CreateObject(1, Enemy, [0.5, -0.55, 0], horizontal, undefined);
    //this.CreateObject(1, Enemy, [-0.85, 0.5, 0], horizontal, undefined);
  }

  UpdateAll() {
    for (let i in this.Visual) {
      this.Visual[i].Update();
    }
    for (let i in this.Solid) {
      this.Solid[i].Update();
    }
    for (let i in this.Trigger) {
      this.Trigger[i].Update();
    }
  }

  RenderAll() {
    for (let i in this.Visual) {
      this.Visual[i].Render(this.program);
    }
    for (let i in this.Solid) {
      this.Solid[i].Render(this.program);
    }
    for (let i in this.Trigger) {
      this.Trigger[i].Render(this.program);
    }
  }

  updateScore() {
    this.score++;
    this.scoreText.innerText = "Score: " + this.score.toString();
    if (this.score === 6) {
      this.scoreText.innerText = "YOU WIN";
    }
  }

  gameEnd() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.scoreText.innerText = "GAME OVER";
  }

  /**
   * @param {number[]} location
   * @param {number| number[]} collision_radius
   * @param {GameObject} obj
   * @return {boolean}
   */
  CheckCollision(location, collision_radius, obj) {
    if (typeof collision_radius !== "number") {
      if (typeof obj.collisionRadius === "number") {
        // If the radius of the object is a number, use it directly for collision check
        const distance = Math.sqrt(
          (location[0] - obj.loc[0]) ** 2 +
            (location[1] - obj.loc[1]) ** 2 +
            (location[2] - obj.loc[2]) ** 2,
        );
        return distance <= collision_radius[1] + obj.collisionRadius;
      } else {
        const loc = obj.loc;
        const scale = obj.scale;
        const ref = obj.reference;

        const x_bounds = [-scale[0] * ref + loc[0], scale[0] * ref + loc[0]];
        const y_bounds = [-scale[1] * ref + loc[1], scale[1] * ref + loc[1]];

        return (
          location[0] - collision_radius[0] < x_bounds[1] &&
          location[0] + collision_radius[0] > x_bounds[0] &&
          location[1] - collision_radius[1] < y_bounds[1] &&
          location[1] + collision_radius[1] > y_bounds[0]
        );
      }
    }
    if (typeof obj.collisionRadius === "number") {
      // If the radius of the object is a number, use it directly for collision check
      const distance = Math.sqrt(
        (location[0] - obj.loc[0]) ** 2 +
          (location[1] - obj.loc[1]) ** 2 +
          (location[2] - obj.loc[2]) ** 2,
      );
      return distance <= collision_radius + obj.collisionRadius;
    } else {
      const loc = obj.loc;
      const scale = obj.scale;
      const ref = obj.reference;

      const x_bounds = [-scale[0] * ref + loc[0], scale[0] * ref + loc[0]];
      const y_bounds = [-scale[1] * ref + loc[1], scale[1] * ref + loc[1]];

      return (
        location[0] - collision_radius < x_bounds[1] &&
        location[0] + collision_radius > x_bounds[0] &&
        location[1] - collision_radius < y_bounds[1] &&
        location[1] + collision_radius > y_bounds[0]
      );
    }
  }

  /**
   * @param {number} type - 0 => Visual, 1 => Solid, 2 => Trigger
   * @param {number[]} loc
   * @param {number[]} rot
   * @param {GameObject} prefab
   * @param {number[] | undefined} scale
   */
  CreateObject(type, prefab, loc, rot, scale) {
    //type 0 = visual
    //type 1 = solid
    //type 2 = trigger
    let temp = new prefab();
    let id = "ID" + this.ObjectCounter;
    this.ObjectCounter++;
    temp.id = id;
    temp.prefab = prefab;
    for (let i = 0; i < 3; i++) {
      temp.loc[i] = loc[i];
      temp.rot[i] = rot[i];
      if (scale != null) {
        temp.scale[i] = scale[i];
      }
    }

    switch (type) {
      case 0:
        this.Visual[id] = temp;
        break;
      case 1:
        this.Solid[id] = temp;
        break;
      case 2:
        temp.isTrigger = true;
        this.Trigger[id] = temp;
        break;
      default:
        break;
    }

    return temp;
  }

  /**
   * @param {string} id
   */
  DestroyObject(id) {
    if (id in this.Visual) delete this.Visual[id];
    if (id in this.Solid) delete this.Solid[id];
    if (id in this.Trigger) delete this.Trigger[id];
  }

  KeyDown(event) {
    this.Keys[String.fromCharCode(event.keyCode)] = true;
  }

  keyUp(event) {
    this.Keys[String.fromCharCode(event.keyCode)] = false;
  }

  TestKey(test) {
    if (test in this.Keys) {
      return this.Keys[test];
    }
    return false;
  }

  MouseClick(event) {
    var rect = canvas.getBoundingClientRect();
    var realX = event.clientX - rect.left;
    var realY = event.clientY - rect.top;
    console.log(realX + "," + realY);
    var x = -1 + (2 * realX) / canvas.width;
    var y = -1 + (2 * (canvas.height - realY)) / canvas.height;
    console.log("The click occurred on " + x + "," + y);
  }
}
