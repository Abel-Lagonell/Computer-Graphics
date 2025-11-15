import {SixAxisController} from "./SixAxisController.js";
import {Vector3} from "./Vector3.js";

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
    }

    UpdateMovement() {
        let movement = new Vector3(0, 0, 0);
        const moveSpeed = this.gpu.deltaTime * this.moveSpeed;

        // Forward/Backward (W/S)
        if (this.IsActionPressed('movement', 'forward')) movement.z += 1;
        if (this.IsActionPressed('movement', 'backward')) movement.z -= 1;

        // Left/Right (A/D)
        if (this.IsActionPressed('movement', 'left')) movement.x -= 1;
        if (this.IsActionPressed('movement', 'right')) movement.x += 1;

        if (movement.magnitude() > 0) {
            // Normalize to prevent faster diagonal movement
            movement = movement.normalize();
            movement = movement.scale(moveSpeed);

            // Transform movement vector by object's rotation
            const rotatedMovement = this.RotateVector(movement);
            this._position = this._position.add(rotatedMovement);
        }
    }

    UpdateRotation() {
    }
}