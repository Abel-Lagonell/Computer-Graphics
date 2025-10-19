import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";
import {Logger} from "../Logger.js";

/**
 * 6-Axis controller Transform that responds to keyboard input
 * WASD + QE for position control
 * IJK + OPL for rotation control
 */
export class SixAxisController extends Transform {
    /**
     * @param {Object} options - Configuration options
     * @param {string} [options.name="Controller"]
     * @param {number} [options.moveSpeed=5] - Movement speed in units per second
     * @param {number} [options.rotateSpeed=90] - Rotation speed in degrees per second
     * @param {boolean} [options.localSpace=true] - Move relative to object's rotation
     * @param {TransformOptions} [options.transform={}] - Initial transform properties
     */
    constructor(options = {}) {
        const {
            name: name = "Controller",
            position: position = Vector3.Zero.copy(),
            rotation: rotation = Vector3.Zero.copy(),
            linearSpeed: moveSpeed = 5,
            angularSpeed: rotateSpeed = 5,
            localSpace: localSpace = true,
        } = options;

        super(name, {position: position, rotation: rotation});

        this.moveSpeed = moveSpeed;
        this.rotateSpeed = rotateSpeed;
        this.localSpace = localSpace;

        // Array of currently pressed keys for modularity
        this.pressedKeys = new Set();

        // Key mapping configurations for easy customization
        this.keyMappings = {
            movement: {
                forward: 'w',
                backward: 's',
                left: 'a',
                right: 'd',
                up: 'e',
                down: 'q'
            },
            rotation: {
                pitchUp: 'i',
                pitchDown: 'k',
                yawLeft: 'j',
                yawRight: 'l',
                rollLeft: 'u',
                rollRight: 'o'
            }
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keydown handler
        this.keydownHandler = (e) => {
            const key = e.key.toLowerCase();
            this.pressedKeys.add(key);

            // Prevent default for all mapped keys
            if (this.isKeyMapped(key)) {
                e.preventDefault();
            }
        };

        // Keyup handler
        this.keyupHandler = (e) => {
            const key = e.key.toLowerCase();
            this.pressedKeys.delete(key);
        };

        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
    }

    /**
     * Check if a key is in our key mappings
     * @param {string} key
     * @returns {boolean}
     */
    isKeyMapped(key) {
        for (let category in this.keyMappings) {
            for (let action in this.keyMappings[category]) {
                if (this.keyMappings[category][action] === key) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if a specific action key is pressed
     * @param {string} category - 'movement' or 'rotation'
     * @param {string} action - The action name
     * @returns {boolean}
     */
    isActionPressed(category, action) {
        const key = this.keyMappings[category]?.[action];
        return key ? this.pressedKeys.has(key) : false;
    }

    /**
     * Override Update to handle input
     */
    Update() {
        this.updateMovement();
        this.updateRotation();
        // Logger.continuousLog(
        //     Logger.QuatLog(this.quaternion) +
        //     Logger.Vector3Log(this.quaternion.rotateVector(Vector3.fromArray([0,1,0])))
        // )
    }

    _Update() {
        super._Update();
        this.Update();
    }

    updateMovement() {
        const movement = new Vector3(0, 0, 0);
        const dt = this.gpu.deltaTime;

        // Forward/Backward (W/S)
        if (this.isActionPressed('movement', 'forward')) movement.z += 1;
        if (this.isActionPressed('movement', 'backward')) movement.z -= 1;

        // Left/Right (A/D)
        if (this.isActionPressed('movement', 'left')) movement.x -= 1;
        if (this.isActionPressed('movement', 'right')) movement.x += 1;

        // Up/Down (E/Q)
        if (this.isActionPressed('movement', 'up')) movement.y += 1;
        if (this.isActionPressed('movement', 'down')) movement.y -= 1;

        if (movement.magnitude() > 0) {
            // Normalize to prevent faster diagonal movement
            movement.normalize();
            movement.scale(this.moveSpeed * dt);

            if (this.localSpace) {
                // Transform movement vector by object's rotation
                const rotatedMovement = this.quaternion.rotateVector(movement);
                this.position = this.position.add(rotatedMovement);
            } else {
                // World space movement
                this.position = this.position.add(movement.scale(this.gpu.deltaTime));
            }
        }
    }

    updateRotation() {
        const rotation = new Vector3(0, 0, 0);
        const rotSpeed = this.rotateSpeed * this.gpu.deltaTime;

        // Pitch (X-axis) - I/K
        if (this.isActionPressed('rotation', 'pitchUp')) rotation.x += rotSpeed;
        if (this.isActionPressed('rotation', 'pitchDown')) rotation.x -= rotSpeed;

        // Yaw (Y-axis) - J/L
        if (this.isActionPressed('rotation', 'yawLeft')) rotation.y += rotSpeed;
        if (this.isActionPressed('rotation', 'yawRight')) rotation.y -= rotSpeed;

        // Roll (Z-axis) - O/P
        if (this.isActionPressed('rotation', 'rollLeft')) rotation.z += rotSpeed;
        if (this.isActionPressed('rotation', 'rollRight')) rotation.z -= rotSpeed;

        if (rotation.magnitude() > 0) {
            this.rotation = this.rotation.add(rotation);
        }
    }

    /**
     * Get all currently pressed keys
     * @returns {string[]}
     */
    getPressedKeys() {
        return Array.from(this.pressedKeys);
    }

    /**
     * Check if any keys are pressed
     * @returns {boolean}
     */
    hasInput() {
        return this.pressedKeys.size > 0;
    }

    /**
     * Remap a key for an action
     * @param {string} category - 'movement' or 'rotation'
     * @param {string} action - The action to remap
     * @param {string} newKey - The new key to assign
     */
    remapKey(category, action, newKey) {
        if (this.keyMappings[category] && this.keyMappings[category][action] !== undefined) {
            this.keyMappings[category][action] = newKey.toLowerCase();
        }
    }

    /**
     * Clean up event listeners when transform is destroyed
     */
    destroy() {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);
        this.pressedKeys.clear();
    }
}