import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {CollisionObject} from "../Scene Inheritance/CollisionObject.js";

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

    }

    async SlowStart() {

        const aisle1_sign = await this.parser.parseObj("./Models/AisleTexture/", "aisle1_sign");
        const aisle2_sign = await this.parser.parseObj("./Models/AisleTexture/", "aisle2_sign");
        const aisle3_sign = await this.parser.parseObj("./Models/AisleTexture/", "aisle3_sign");
        const counter = await this.parser.parseObj("./Models/AisleTexture/", "counter");
        this.RecordVerts("aisle1_sign", aisle1_sign);
        this.RecordVerts("aisle2_sign", aisle2_sign);
        this.RecordVerts("aisle3_sign", aisle3_sign);
        this.RecordVerts("counter", counter);
        this.collisionObjects["counter"] = new Vector3(0.75, 6.5, 0);

        const shelf = await this.parser.parseObj("./Models/ShelfTexture/", "shelf");
        const shelf2 = await this.parser.parseObj("./Models/ShelfTexture/", "shelf2");
        const endShelf = await this.parser.parseObj("./Models/ShelfTexture/", "endShelf");
        this.RecordVerts("shelf", shelf);
        this.RecordVerts("shelf", shelf2);
        this.RecordVerts("endShelf", endShelf);
        this.collisionObjects["shelf"] = new Vector3(2, 6.25, 0);
        this.collisionObjects["shelf2"] = new Vector3(1, 0.75, 0);
        this.collisionObjects["endShelf"] = this.collisionObjects["shelf2"].copy();


        const zombie = await this.parser.parseObj("./Models/Zombie/", "zombie");
        this.RecordVerts("zombie", zombie);
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
     * @param transform : Transform
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

    }


}