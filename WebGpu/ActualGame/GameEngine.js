import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {CollisionObject} from "../Scene Inheritance/CollisionObject.js";
import {WebGPU} from "../WebGPU.js";
import {SimpleCharacterController} from "../Scene Inheritance/SimpleCharacterController.js";
import {Zombie} from "../Scene Inheritance/Zombie.js";
import {PickUpAble} from "../Scene Inheritance/PickUpAble.js";

export class GameEngine {
    static Instance = null;

    /**
     *
     * @param gpu : WebGPU
     */
    constructor(gpu) {
        if (!GameEngine.Instance) {
            GameEngine.Instance = this;
        }

        this.gpu = gpu;

        this.parser = new OBJParser();
        this.SlowStart();

        /** @type {Object.<string, [Float32Array]>} */
        this.gameObjects = {}

        /** @type {Object.<string, Vector3>} */
        this.collisionObjects = {}

        /** @type {Object.<string, Vector3>} */
        this.positions = {}
        /** @type {Object.<string, Vector3>} */
        this.rotations = {}

        this.isReady =false;
        this.WaitForReady();

    }

    async WaitForReady(){
        if (!this.isReady){
            console.log("WaitForReady");
            await new Promise(resolve => setTimeout(resolve, 400));
        }
        return this.isReady;
    }

    async SlowStart() {

        const zombie = await this.parser.parseObj("./Models/Zombie/", "zombie");
        this.RecordVerts("zombie", zombie);

        //Load in place
        // this.SetValuesUP()

        this.isReady = true;
    }

    /**
     * @param string : String
     * @param transform : Transform
     * @constructor
     */
    RecordVerts(string, transform) {
        let vert = [];

        for (let child of Object.values(transform.children)) {
            if (child instanceof MeshObject)
                vert.push(child.vertices);
        }

        transform.UnRegister();

        this.gameObjects[string] = vert;
    }

    /**
     * @param string : string
     * @constructor
     */
    MakeObject(string) {
        let transform = new Transform(string);
        let position = Vector3.Zero;
        let rotation = Vector3.Zero;
        if (this.positions[string]) {
            position = this.positions[string];
        }
        if (this.rotations[string]) {
            rotation = this.rotations[string];
        }
        if (string === "zombie") {
            this.gpu.AddShape([new Zombie(this.gameObjects[string], {position: position, rotation: rotation})]);
            return;
        }
        for (let array of this.gameObjects[string]) {
            transform.AddChild(new MeshObject({name: string + "Mesh", finalVertices: array}));
        }
        if (this.collisionObjects[string]) {
            let collision = this.collisionObjects[string];
            if (rotation.y === 3.1415 / 2 || rotation.y === 3.1415 * 3 / 2)
                collision = new Vector3(collision.y, collision.x, 0);
            transform.AddChild(new CollisionObject({name: string + "Collision", bounds: collision}));
        }

        transform.position = position;
        transform.rotation = rotation;
        return transform;
    }


    GameWin() {
        let canvas = document.querySelector("canvas");
        cancelAnimationFrame(WebGPU.Instance.reqAF)
        canvas.hidden = true;
        document.exitPointerLock();
        let text = document.getElementById("text");
        for (let shape of Object.values(WebGPU.Instance.registeredShapes)) {
            if (shape instanceof SimpleCharacterController) {
                if (shape.value === 0) {
                    text.innerText = shape.value;
                }
            }
        }

        text.hidden = false;
    }

    GameEnd() {
        let canvas = document.querySelector("canvas");
        cancelAnimationFrame(WebGPU.Instance.reqAF)
        canvas.hidden = true;
        document.exitPointerLock();
        let text =document.getElementById("text");
        text.innerHTML = "Your Bad lmao";
        text.hidden = false;
    }

    SetValuesUP(){
        for (let shape of Object.values(this.gpu.registeredShapes)){
            if (shape.name.includes("stuf")){
                shape.AddChild(new CollisionObject({bounds: new Vector3(1,0,0)}));
                shape.AddChild(new PickUpAble(1,2));
            }
            if (shape.name.includes("flour")){
                shape.AddChild(new CollisionObject({bounds: new Vector3(1,0,0)}));
                shape.AddChild(new PickUpAble(5,7));
            }
            if (shape.name.includes("jimbo")){
                shape.AddChild(new CollisionObject({bounds: new Vector3(1,0,0)}));
                shape.AddChild(new PickUpAble(3,5));
            }
        }
    }


}