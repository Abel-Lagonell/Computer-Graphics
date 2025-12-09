import {OBJParser} from "../Scene Inheritance/OBJParser.js";
import {MeshObject} from "../Scene Inheritance/MeshObject.js";
import {Vector3} from "../Scene Inheritance/Vector3.js";
import {Transform} from "../Scene Inheritance/Transform.js";
import {CollisionObject} from "../Scene Inheritance/CollisionObject.js";
import {WebGPU} from "../WebGPU.js";
import {SimpleCharacterController} from "../Scene Inheritance/SimpleCharacterController.js";
import {PickUpAble} from "../Scene Inheritance/PickUpAble.js";
import {Zombie} from "../Scene Inheritance/Zombie.js";

export class GameEngine {
    static Instance = null;

    pJimbo = [
        new Vector3(-5.8,0,-20),
        new Vector3(-0.4,0,0),
        new Vector3(-15,0,-6.6),
        new Vector3(-11,0,16),
        new Vector3(17,0,-20),
    ]

    pStuf = [
        new Vector3(-0.5,0,10),
        new Vector3(4.2,0,1),
        new Vector3(17,0,1),
        new Vector3(17.6,0,20),
        new Vector3(16,0,-1.6),
        new Vector3(-15,0,-20.1),
        new Vector3(17.2,0,12),
        new Vector3(2.8,0,11.7),
        new Vector3(10,0,-20.5),
        new Vector3(17.6,0,19.4),
        new Vector3(17.6,0,19.8),
    ]

    pFlour = [
        new Vector3(16,0,6.3),
        new Vector3(11.8,0,-10),
        new Vector3(2.8,0,-1.3),
        new Vector3(7.2,0,1.1),
        new Vector3(2.2,0,9.9),
        new Vector3(17,0,11.4),
        new Vector3(2.8,0,-20),
        new Vector3(-13.9,0,-21.2),
        new Vector3(3.7,0,-11.7),
        new Vector3(16.9,0,-11.7),
        new Vector3(17.6,0,-12),
    ]


    /**
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

        this.collisionObjects = []

        /** @type {Object.<string, Vector3>} */
        this.positions = {}
        /** @type {Object.<string, Vector3>} */
        this.rotations = {}

        this.jimbo =0;
        this.flour = 0;
        this.stuf =0;
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

        const store = await this.parser.parseObj("./Models/Store/","store")
        await this.gpu.AddShape([store]);

        this.SetValuesUP()

        this.collisionObjects= [
            new CollisionObject({position: new Vector3(4.3,0,0), bounds: new Vector3(10,3,0)}),
            new CollisionObject({position: new Vector3(4.3,0,11.0), bounds: new Vector3(10,3,0)}),
            new CollisionObject({position: new Vector3(4.3,0,-10.7), bounds: new Vector3(10,3,0)}),
            new CollisionObject({position: new Vector3(-9.17,0,0), bounds: new Vector3(8.4,3,0)}),
            new CollisionObject({position: new Vector3(-9.17,0,-10.7), bounds: new Vector3(8.4,3,0)}),
            new CollisionObject({position: new Vector3(0,0,-22), bounds: new Vector3(100,3,0)}),
            new CollisionObject({position: new Vector3(0,0,22.5), bounds: new Vector3(100,3,0)}),
            new CollisionObject({position: new Vector3(18.5,0,0), bounds: new Vector3(3,100,0)}),
            new CollisionObject({position: new Vector3(-18.76,0,16.5), bounds: new Vector3(13.7,13,0)}),
            new CollisionObject({position: new Vector3(-19.7,0,4.03), bounds: new Vector3(5,23.6,0)}),
            new CollisionObject({position: new Vector3(-22.7,0,-22), bounds: new Vector3(13.7,13,0)}),
            new CollisionObject({position: new Vector3(11.4,0,-10.8), bounds: new Vector3(3,3,0)}),
            new CollisionObject({position: new Vector3(13.4,0,-8.6), bounds: new Vector3(3,3,0)}),
            new CollisionObject({position: new Vector3(15.4,0,-6.1), bounds: new Vector3(3,3,0)}),
        ]

        let collisions = new Transform("CollisionObject")
        for(let collision of this.collisionObjects){
            await collisions.AddChild(collision);
        }

        console.log(this.gameObjects)
        let zombieA = new Zombie(this.gameObjects["zombie"], {position: new Vector3(9.88,0,-17.3)});

        await this.gpu.AddShape([collisions, zombieA])
        console.log(collisions);
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

    GameWin() {
        let canvas = document.querySelector("canvas");
        cancelAnimationFrame(WebGPU.Instance.reqAF)
        canvas.hidden = true;
        document.exitPointerLock();
        let text = document.getElementById("text");
        for (let shape of Object.values(WebGPU.Instance.registeredShapes)) {
            if (shape instanceof SimpleCharacterController) {
                if (shape.value <= 7) {
                    text.innerHTML = `You escape with scant supplies. Perhaps the close proximity with an undead human unsettled you so, forcing you to flee before grabbing much. Perhaps you meant to leave something for the next survivor.<br><br>Either way, you'll need to venture out again before long. This will hardly last you the week, if that.<center><h2 style=\"color:  green\">YOU ESCAPED</h2><br> with food for ${shape.value} days.</center><br><br>Refresh the page to play again or click <button onClick=\"window.location.reload();\">here.</button>`
                }else {
                    text.innerHTML = `You escape with a good amount in your rucksack. You'll be eating well, or at least eating consistently. The supplies you got will last you for some time, and hopefully until you stumble upon your next location to raid or a safe haven.<br><br>I applaud you for your courage.<center><h2 style=\"color:  green\">YOU ESCAPED</h2><br> with food for ${shape.value} days.</center><br><br>Refresh the page to play again or click <button onClick=\"window.location.reload();\">here.</button>`
                }
            }
        }

        text.hidden = false;
    }

    GameEnd() {
        let death = "The next survivor to follow in your footsteps will have an even more difficult time raiding this store for supplies, as <span style=\"color: red\"><b>two</b> living dead</span> now haunt these halls. <h2 style=\"color:  red\"><center>YOU HAVE DIED</center></h2><br>Refresh the page to try again or click <button onClick=\"window.location.reload();\">here.</button>";
        let canvas = document.querySelector("canvas");
        cancelAnimationFrame(WebGPU.Instance.reqAF)
        canvas.hidden = true;
        document.exitPointerLock();
        let text =document.getElementById("text");
        text.innerHTML = death; 
        text.hidden = false;
    }

    SetValuesUP(){
        for (let shape of Object.values(this.gpu.registeredShapes)){
            if (shape.name.includes("stuf")){
                shape.AddChild(new CollisionObject({bounds: new Vector3(1,0,0), isTrigger: true , position: this.pStuf[this.stuf]}));
                shape.AddChild(new PickUpAble(1,2));
                this.stuf++;
            }
            if (shape.name.includes("flour")){
                shape.AddChild(new CollisionObject({bounds: new Vector3(1,0,0), isTrigger: true, position: this.pFlour[this.flour]}));
                shape.AddChild(new PickUpAble(5,7));
                this.flour++;
            }
            if (shape.name.includes("jimbo")){
                shape.AddChild(new CollisionObject({bounds: new Vector3(1,0,0), isTrigger: true, position:this.pJimbo[this.jimbo] }));
                shape.AddChild(new PickUpAble(3,5));
                this.jimbo++;
            }
        }
    }


}