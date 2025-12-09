import {Transform} from "./Transform.js";
import {SimpleCharacterController} from "./SimpleCharacterController.js";
import {RayCast} from "./RayCast.js";
import {CollisionObject} from "./CollisionObject.js";
import {Vector3} from "./Vector3.js";
import {Quaternion} from "./Quaternion.js";
import {MeshObject} from "./MeshObject.js";
import {SpatialSound} from "./SpatialSound.js";
import {GameEngine} from "../ActualGame/GameEngine.js";

export class Zombie extends Transform {
    constructor(verts, options = {}) {
        const {
            seekingRadius = 10,
            linearSpeed = 3,
        } = options

        super("Zombie", {...options});

        this.seekingRadius = seekingRadius;
        this.linearSpeed = linearSpeed;
        /** @type [Float32Array]*/
        this.meshVerts = verts;

        for (let shapeKey in this.gpu.registeredShapes) {
            if (this.gpu.registeredShapes[shapeKey] instanceof SimpleCharacterController) {
                /** @type SimpleCharacterController */
                this.player = this.gpu.registeredShapes[shapeKey];
            }
        }
        this.collider = new CollisionObject({
            bounds: new Vector3(1.5, 0, 0)
        });

        this.dangerZone = 7.5

        this.SlowStart()
    }

    async SlowStart(){
        if (this.gpu){
            await this.gpu.WaitForReady();
        }

        this.groan = new SpatialSound("./Sounds/zombie.wav", {
            maxDistance: 20,
            coneInnerAngle: 90,
            coneOuterAngle: 360,
            autoplay: true,
            volume: 2,
        })

        await this.AddChild(this.collider);
        await this.AddChild(this.groan);

        for (let vert of this.meshVerts){
            let mesh = new MeshObject({finalVertices: vert, rotation: new Vector3(0, 3.1415,0)});

            await this.AddChild(mesh);
        }

        this.StartGroaning();
    }

    Update() {

        if (this.LocateDistanceToPlayer() > this.seekingRadius){
            this.linearVelocity = Vector3.Zero;
            return;
        }
        if (this.LocateDistanceToPlayer() <= this.dangerZone)
            GameEngine.Instance.GameEnd();

        //Lookat player
        let toVector = this.player.globalPosition.subtract(this.globalPosition);
        toVector.y = 0; // Keep rotation on horizontal plane only
        toVector = toVector.normalize();

        // Calculate the angle using atan2 for proper direction
        let angle = Math.atan2(toVector.x, toVector.z);

        // Set the rotation directly
        this.quaternion = Quaternion.fromEuler(new Vector3(0, angle, 0));

        //Move Towards Player
        let targetVelocity = this.forward;
        let proposedPosition = this.position.add(targetVelocity.scale(this.gpu.deltaTime))
        let canMove = true;

        for (let shapeKey in this.gpu.registeredShapes) {
            let shapeObject = this.gpu.registeredShapes[shapeKey];
            if (shapeObject instanceof RayCast) continue;

            if (shapeObject instanceof CollisionObject && shapeObject.ID !== this.collider.ID) {
                let isValid = this.collider.LocationValidation(
                    proposedPosition,
                    shapeObject
                );

                if (!isValid) {
                    canMove = false;
                    break;
                }
            }
        }

        if (canMove) {
            this.linearVelocity = targetVelocity;
        } else {
            this.linearVelocity = Vector3.Zero;
        }
    }

    LocateDistanceToPlayer() {
        return this.player.globalPosition.distanceTo(this.globalPosition)
    }

    async StartGroaning() {
        this.groan.Play();
        while (this.groan.isPlaying) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        let rand = (Math.random())*2500+500;
        await new Promise(resolve => setTimeout(resolve, rand));
        this.StartGroaning();
    }


}