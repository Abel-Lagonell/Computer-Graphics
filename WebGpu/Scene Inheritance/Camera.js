import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";

export class Camera extends Transform {
    constructor(options = {}) {
        const {
            name = "Camera",
            position = new Vector3(0,0, 0),
            rotation = Vector3.Zero.copy(),
            near = 0.001,
            far = 5000,
            right = 0.001,
            left = -0.001,
            top = 0.001,
            bottom = -0.001,
        } = options;


        super(name, {position: position, rotation: rotation, scale: Vector3.One});

        this.perspectiveMatrix = math.matrix([
            [(2 * near) / (right - left), 0, 0, 0],
            [0, 2 * near / (top - bottom), 0, 0],
            [(right + left) / (right - left), (top + bottom) / (top - bottom), (far + near) / (far - near), 1],
            [0, 0, 2 * far * near / (far - near), 1]
        ]);
    }

    CalculateMatrix() {
        let changed = false;

        if (this.CheckRotationChanged())
            changed = true;
        if (this.CheckPositionChanged())
            changed = true;

        if (changed)
            this.localTransformMatrix = math.multiply(this.rotationMatrix, this.translateMatrix)

        return this.localTransformMatrix;
    }

    CalculateTranslationMatrix() {
        return math.matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [-1 * this.position.x, -1 * this.position.y, -1 * this.position.z, 1],
        ])
    }

    WriteToBuffer() {
        this.CalculateMatrix();
    }

    WriteToGPU() {
        this.CallInChildren("WriteToGPU")
    }

    Render(pass) {
        pass.setBindGroup(1, this.bindGroup);
        this.WriteToBuffer();
        this.CallInChildren("Render", pass);
    }
}