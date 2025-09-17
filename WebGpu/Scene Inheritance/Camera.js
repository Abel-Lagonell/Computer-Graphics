import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";

export class Camera extends Transform {
    isCamera = true;

    constructor(options = {}) {
        const {
            name = "Camera",
            position = new Vector3(0, 0, 0),
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
        if (this.CheckScaleChanged())
            changed = true;

        if (changed) {
            this.rotationMatrix = this.quaternion.Matrix;
            this.localTransformMatrix = math.multiply(
                math.multiply(this.scaleMatrix, this.rotationMatrix),
                this.translateMatrix
            );
            this.markDirty()
        }

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

    get globalPositionMatrix() {
        const pos = this.globalPosition;
        return math.matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [-pos.x, -pos.y, -pos.z, 1], // Negative for camera view matrix
        ])
    }

    WriteToBuffer() {
        this.CalculateMatrix();
        let matrix;
        if (this.parent !== null) {
            this.CalculateGlobalMatrix()
        } else {
            this.globalTransformMatrix = this.localTransformMatrix;
        }

        matrix = [...math.flatten(this.globalTransformMatrix).toArray()];
        this.gpu.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(matrix))
    }

    WriteToGPU() {
        this.uniformBufferSize = 4 * 4 * 4; // 4 columns * 4 rows * 4 bytes

        this.uniformBuffer = this.gpu.device.createBuffer({
            size: this.uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.bindGroup = this.gpu.device.createBindGroup({
            layout: this.gpu.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer: this.uniformBuffer}},
            ]
        });

        this.WriteToBuffer();

        this.CallInChildren("WriteToGPU")
    }

    Render(pass) {
        pass.setBindGroup(1, this.bindGroup);
        this.WriteToBuffer();
        this.CallInChildren("Render", pass);
    }
}