//@ts-check
class main {
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

    this.CreateObject(1, MainCharacter, [0, 0, 0], [0, 0, 0]);
    this.CreateObject(1, Walls, [0, 0, 0], [0, 0, 0]);
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
    requestAnimationFrame(main.MainLoop);
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

  CheckCollision(loc1, rad1, loc2, rad2) {}

  CreateObject(type, prefab, loc, rot) {
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
    var x = -1 + (2 * realX) / myCanvas.width;
    var y = -1 + (2 * (myCanvas.height - realY)) / myCanvas.height;
    console.log("The click occurred on " + x + "," + y);
  }
}
