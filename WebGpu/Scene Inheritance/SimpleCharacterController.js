import {SixAxisController} from "./SixAxisController.js";
import {Vector3} from "./Vector3.js";
import {CollisionObject} from "./CollisionObject.js";
import {Quaternion} from "./Quaternion.js";
import {RayCast} from "./RayCast.js";
import {Camera} from "./Camera.js";
import {Transform} from "./Transform.js";
import {PickUpAble} from "./PickUpAble.js";
import {SpatialSound} from "./SpatialSound.js";
import {OBJParser} from "./OBJParser.js";
import {MeshObject} from "./MeshObject.js";

export class SimpleCharacterController extends SixAxisController {
    constructor(options = {}) {
        const {
            name: name = "Controller",
            linearSpeed: moveSpeed = 5,
            mouseSensitivity = 0.1,
        } = options;

        super({
            ...options,
            localSpace: true,
        });

        this.collider = new CollisionObject({
            name: "Player Collision",
            bounds: new Vector3(2, 0, 0),
        })
        this.rayCast = new RayCast({
            length: 15,
        });
        this.camera = new Camera();
        Transform.setCameraReference(this.camera);


        this.feet = new SpatialSound("./Sounds/footstep.wav", {coneOuterAngle: 360, volume: 0.5})
        this.canPlayFootStep = true;

        this.takeSound = new SpatialSound("./Sounds/inventory.wav", {coneOuterAngle: 360, volume: 0.5})

        this.input = Vector3.Zero.copy();
        this.mouseDelta = Vector3.Zero.copy();
        this.hasMouseLock = false;
        this.mouseSensitivity = mouseSensitivity;
        this.pitch = 0;
        this.yaw = 0;

        this.weight = 0;
        this.value = 0;

        this.keyMappings['actions'] = {
            interact: "t"
        }

        this.listener = this.gpu.audioContext.listener;
        this.SetListenerPosition()
        this.SetListenerRotation()

        this.SlowStart()
    }

    async SlowStart() {
        if (this.gpu) {
            await this.gpu.WaitForReady();
        }
        let parser = new OBJParser();
        this.hands = await parser.parseObj("./Models/Hands/", "hands")
        this.hands.scale = Vector3.One.scale(1 / 3)
        this.hands.position = this.forward.scale(1.5).add(Vector3.Down.scale(7));
        this.hands.rotation = new Vector3(0, 3.1415, 0)


        // WebGPU.Instance.AddShape([this.hands])
        await this.AddChild(this.hands)
        await this.AddChild(this.collider);
        await this.AddChild(this.rayCast);
        await this.AddChild(this.camera);


        this.ignorelist = {}
        this.ignorelist[this.collider.ID] = this.collider;
    }

    async AddChild(child) {
        await super.AddChild(child);
        this.CheckChildCollision(child)
    }

    /** @param child : Transform */
    CheckChildCollision(child) {
        for (let grandchild of Object.values(child.children)) {
            if (grandchild instanceof CollisionObject)
                this.ignorelist[grandchild.ID] = grandchild;
            this.CheckChildCollision(grandchild);
        }
    }

    SetListenerPosition() {
        this.listener.positionX.value = this.position.x;
        this.listener.positionY.value = this.position.y;
        this.listener.positionZ.value = this.position.z;
    }

    SetListenerRotation() {
        const forward = this.forward;
        const up = this.quaternion.rotateVector(Vector3.Up);

        this.listener.forwardX.value = -forward.x;
        this.listener.forwardY.value = forward.y;
        this.listener.forwardZ.value = -forward.z;

        this.listener.upX.value = up.x;
        this.listener.upY.value = up.y;
        this.listener.upZ.value = up.z;
    }

    SetupEventListeners() {
        super.SetupEventListeners();

        document.addEventListener("pointerlockchange", () => {
            this.hasMouseLock = !this.hasMouseLock;
        });

        window.addEventListener("mousemove", (ev) => {
            if (this.hasMouseLock)
                this.mouseDelta = Vector3.fromArray([ev.movementY, ev.movementX, 0]);
        });

        this.gpu.canvas.addEventListener("click", (e) => {
            if (!this.hasMouseLock)
                this.gpu.canvas.requestPointerLock();
            document.dispatchEvent(new CustomEvent("playerInteracted"))
        })

        document.addEventListener("keydown", (e) => {
            const key = e.key.toLowerCase();
            this.UpdateActions(key);
        })
    }

    UpdateMovement() {
        let movement = new Vector3(0, 0, 0);

        // Forward/Backward (W/S)
        if (this.IsActionPressed('movement', 'forward')) movement.z += 1;
        if (this.IsActionPressed('movement', 'backward')) movement.z -= 1;

        // Left/Right (A/D)
        if (this.IsActionPressed('movement', 'left')) movement.x -= 1;
        if (this.IsActionPressed('movement', 'right')) movement.x += 1;

        movement = movement.normalize();
        this.input = this.RotateVector(movement);

        if (this.input.magnitude() === 0) {
            this.linearVelocity = Vector3.Lerp(this.linearVelocity, Vector3.Zero, this.gpu.deltaTime * 10);
            return;
        }

        let targetVelocity = this.input.scale(this.Sigmoid(this.weight));
        targetVelocity.y = 0;

        let temp = Vector3.Lerp(this.linearVelocity, targetVelocity, this.gpu.deltaTime * 2);

        let proposedPosition = this.position.add(temp.scale(this.gpu.deltaTime));

        let canMove = true;
        let collidingObject = null;

        for (let shape in this.gpu.registeredShapes) {
            let shapeObject = this.gpu.registeredShapes[shape];
            if (shapeObject instanceof RayCast) continue;

            if (shapeObject instanceof CollisionObject && shapeObject.ID !== this.collider.ID) {
                let isValid = this.collider.LocationValidation(
                    proposedPosition,
                    shapeObject
                );

                if (!isValid) {
                    canMove = false;
                    collidingObject = shapeObject;
                    break;
                }
            }
        }

        if (canMove) {
            this.linearVelocity = temp;
            if (this.canPlayFootStep) {
                this.feet.Play();
                this.WaitFootStep();
                this.canPlayFootStep = false;

            }
        } else {
            // Collision detected - try sliding along the surface
            const dx = collidingObject.globalPosition.x - this.globalPosition.x;
            const dz = collidingObject.globalPosition.z - this.globalPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 0.001) {
                const normalX = -dx / distance;
                const normalZ = -dz / distance;

                const dotProduct = temp.x * normalX + temp.z * normalZ;

                if (dotProduct < 0) {
                    const slideVelocity = new Vector3(
                        temp.x - normalX * dotProduct,
                        0,
                        temp.z - normalZ * dotProduct
                    );

                    let slidePosition = this.position.add(slideVelocity.scale(this.gpu.deltaTime));
                    let canSlide = this.collider.LocationValidation(slidePosition, collidingObject);

                    if (canSlide) {
                        this.linearVelocity = slideVelocity;
                    } else {
                        this.linearVelocity = Vector3.Lerp(this.linearVelocity, Vector3.Zero, this.gpu.deltaTime * 15);
                    }
                } else {
                    this.linearVelocity = temp;
                }
            } else {
                this.linearVelocity = Vector3.Lerp(this.linearVelocity, Vector3.Zero, this.gpu.deltaTime * 15);
            }
        }
    }

    UpdateRotation() {
        // Track pitch and yaw separately as properties
        if (!this.pitch) this.pitch = 0;
        if (!this.yaw) this.yaw = 0;

        // Apply mouse deltas to separate values
        this.pitch += this.mouseDelta.x * this.mouseSensitivity;
        this.yaw += this.mouseDelta.y * this.mouseSensitivity;

        if (Math.abs(this.yaw) >= 6.283) {
            this.yaw = 0;
        }

        // Clamp pitch to prevent flipping
        this.pitch = Math.max(-75 * 3.1415 / 180, Math.min(75 * 3.1415 / 180, this.pitch));

        const yawQuat = Quaternion.fromEuler(new Vector3(0, this.yaw, 0));
        const pitchQuat = Quaternion.fromEuler(new Vector3(this.pitch, 0, 0));

        this.quaternion = this.quaternion.Lerp(yawQuat.multiply(pitchQuat), this.gpu.deltaTime * 10);

        this.mouseDelta = Vector3.Zero.copy();
    }

    async UpdateActions(key) {
        if (key === this.keyMappings['actions']['interact']) {
            let hit = await this.rayCast.SendRCTrigger(this.ignorelist)
            if (hit === null)
                return


            console.log(hit)
            let realObject = hit;
            do {
                realObject = realObject.parent;
            } while (!(realObject instanceof MeshObject))

            for (let child of Object.values(realObject.children)) {
                if (child instanceof PickUpAble) {
                    //Add the value to our current total
                    this.weight += child.weight;
                    this.value += child.value;
                    //Delete the object from existence
                    if (realObject.parent === null) {
                        delete this.gpu.shapes[realObject.ID];
                    } else {
                        delete realObject.parent.children[realObject.ID];
                    }
                    this.UnregisterShape(realObject.ID);

                    //Play Sound
                    this.takeSound.Play();
                }
            }
        }
    }

    UnregisterShape(ID) {
        for (let child of Object.values(this.gpu.registeredShapes[ID].children)) {
            delete this.gpu.registeredShapes[child.ID];
        }
    }

    Update() {
        this.UpdateMovement()
        this.UpdateRotation()

        this.SetListenerPosition();
        this.SetListenerRotation();
    }

    /**
     * S Function that goes from Max to Min with the S in the middle determined by the delta
     * @param input : number x value
     * @param max : number the max you want to have
     * @param min : number the min you want to have
     * @param delta : number how steep the S curve is
     * @param leeway : number how much to the left or the right does the curve need to be
     * @return {number} the y value of the sigmoid function
     * @constructor
     */
    Sigmoid(input, max = this.moveSpeed, min = 0.15, delta = 1, leeway = 0) {
        return min + (max - min) / (1 + Math.exp(delta * (input - leeway - max)))
    }

    async WaitFootStep() {
        await new Promise(resolve => setTimeout(resolve, 500 * this.moveSpeed / this.Sigmoid(this.weight, this.moveSpeed, 1)));
        this.canPlayFootStep = true;
    }
}