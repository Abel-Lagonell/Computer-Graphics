import {SixAxisController} from "./SixAxisController.js";
import {Vector3} from "./Vector3.js";
import {CollisionObject} from "./CollisionObject.js";
import {Transform} from "./Transform.js";

export class SimpleCharacterController extends SixAxisController {
    constructor(options = {}) {
        const {
            name: name = "Controller",
            position: position = Vector3.Zero.copy(),
            rotation: rotation = Vector3.Zero.copy(),
            linearSpeed: moveSpeed = 5,
            angularSpeed: rotateSpeed = 5,
        } = options;

        super({
            name: name,
            position: position,
            rotation: rotation,
            linearSpeed: moveSpeed,
            angularSpeed: rotateSpeed,
            localSpace: true,
        });

        this.collider = new CollisionObject({
            name: "Player Collision",
            bounds: new Vector3(1, 0, 0),
        })

        this.input = Vector3.Zero.copy();

        this.AddChild(this.collider);
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
    }

    Update() {
        this.UpdateMovement()

        if (this.input.magnitude() === 0) {
            this.linearVelocity = Vector3.Lerp(this.linearVelocity, Vector3.Zero, this.gpu.deltaTime * 10);
            return
        }

        let temp = Vector3.Lerp(this.linearVelocity, this.input.scale(this.moveSpeed), this.gpu.deltaTime*2);
        // Calculate the proposed new position
        let proposedPosition = this.position.add(temp.scale(this.gpu.deltaTime));

        let canMove = true;
        let collidingObject = null;

        for (let shape in this.gpu.registeredShapes) {
            let shapeObject = this.gpu.registeredShapes[shape];

            // Check if it's a Collision Object (has bounds property)
            if (shapeObject instanceof CollisionObject && shapeObject.ID !== this.collider.ID) {

                // Validate Location
                let isValid = this.collider.LocationValidation(
                    proposedPosition,
                    shapeObject
                );

                if (!isValid) {
                    // Collision detected - stop moving
                    canMove = false;
                    collidingObject = shapeObject;
                    break;
                }
            }
        }

        if (canMove) {
            this.linearVelocity = temp;
        } else {
            // If we're colliding, check if we're already overlapping
            let currentlyOverlapping = !this.collider.LocationValidation(
                this.position,
                collidingObject
            );

            if (currentlyOverlapping) {
                // We're stuck inside - push out
                const dx = this.position.x - collidingObject.position.x;
                const dz = this.position.z - collidingObject.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance > 0.001) {
                    // Normalize and push away
                    const pushX = (dx / distance);
                    const pushZ = (dz / distance);

                    const radius1 = this.collider.bounds.x;
                    const radius2 = collidingObject.bounds.y === 0 ? collidingObject.bounds.x : 0;
                    const minDistance = radius1 + (radius2 || Math.max(collidingObject.bounds.x, collidingObject.bounds.y) * 0.7071); // For boxes, use diagonal approximation

                    // Push to minimum safe distance
                    const pushDistance = minDistance - distance + 0.1; // Small buffer
                    this.position = new Vector3(
                        this.position.x + pushX * pushDistance,
                        this.position.y,
                        this.position.z + pushZ * pushDistance
                    );
                }

                // Allow movement perpendicular to collision direction
                const dotProduct = (temp.x * dx + temp.z * dz) / (distance || 1);
                if (dotProduct < 0) {
                    // Moving away from collision, allow it
                    this.linearVelocity = temp;
                } else {
                    this.linearVelocity = Vector3.Zero.copy();
                }
            } else {
                // Just hitting the edge, stop
                this.linearVelocity = Vector3.Zero.copy();
            }
        }
    }
}