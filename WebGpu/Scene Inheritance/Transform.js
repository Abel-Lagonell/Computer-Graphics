import {Vector3} from "./Vector3.js";
//@ts-check
/** @type {import('mathjs')}*/

export class Transform {

    /** @type {Transform|null} */
    parent = null;
    /** @type {Transform[]} */
    children = [];

    /**
     *
     * @param name : string
     * @param {TransformOptions} [options={}] - Optional transform parameters
     * @param {Vector3} [options.position=Vector3.Zero]
     * @param {Vector3} [options.rotation=Vector3.Zero]
     * @param {Vector3} [options.scale=Vector3.One]
     *
     */
    constructor(name, options = {}) {
        this.name = name;
        this.gpu = WebGPU.Instance;

        const {
            position = Vector3.Zero,
            rotation = Vector3.Zero,
            scale = Vector3.One
        } = options;

        this.position = position;
        this.rotation = rotation;
        this.scale = scale;

        this.oldPosition = Vector3.Empty();
        this.oldRotation = Vector3.Empty();
        this.oldScale = Vector3.Empty();

        this.Ready();
        this.globalTransformMatrix = this.CalculateMatrix();
        this.vertices = new Float32Array([...this.position.array, 0, 0, 0]);
    }

    get Forward() {
        this.CalculateRotationMatrix();
        return math.cross(this.rotationZMatrix,
            math.cross(this.rotationYMatrix,
                math.cross(this.rotationXMatrix, [0, 0, 1, 0])))
    }

    get Right() {
        this.CalculateRotationMatrix();
        return math.cross(this.rotationZMatrix,
            math.cross(this.rotationYMatrix,
                math.cross(this.rotationXMatrix, [1, 0, 0, 0])))
    }

    get Up() {
        this.CalculateRotationMatrix();
        return math.cross(this.rotationZMatrix, math
            .cross(this.rotationYMatrix,
                math.cross(this.rotationXMatrix, [0, 1, 0, 0])))
    }

    Ready() {
        this.CallInChildren("Ready")
    }

    Update() {
        this.CallInChildren("Update")
    }

    /**
     *
     * @param funcName : string
     * @param parameters : any[]
     */
    CallInChildren(funcName, ...parameters) {
        if (!this.children || this.children.length === 0) {
            return;
        }

        for (let child of this.children) {
            try {
                if (child && typeof child[funcName] === 'function') {
                    child[funcName](...parameters);
                } else {
                    console.warn(`Child missing method: ${funcName}`);
                }
            } catch (error) {
                console.error(`Error calling ${funcName} on child:`, error);
            }
        }
    }

    /**
     * @param child : Transform
     */
    AddChild(child) {
        this.children.push(child);
        child.parent = this;
    }

    Render(pass) {
        pass.setBindGroup(0, this.bindGroup)
        this.WriteToBuffer()
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(1);
        this.CallInChildren("Render", pass)
    }

    WriteToBuffer() {
        this.CalculateMatrix();
        let matrix
        if (this.parent !== null) {
            this.globalTransformMatrix = math.multiply(this.localTransformMatrix, this.parent.globalTransformMatrix);
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

        this.vertexBuffer = this.gpu.device.createBuffer({
            label: this.name,
            size: this.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });

        this.gpu.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);

        this.CallInChildren("WriteToGPU")
    }

    CalculateMatrix() {
        let changed = false;

        if (this.CheckScaleChanged())
            changed = true;

        if (this.CheckPositionChanged())
            changed = true;

        if (this.CheckRotationChanged())
            changed = true;

        if (changed) {
            this.localTransformMatrix = math.multiply(math.multiply(this.scaleMatrix, this.rotationMatrix), this.translateMatrix);
        }
        return this.localTransformMatrix;
    }

    CalculateRotationMatrix() {
        let sin = new Vector3(Math.sin(this.rotation.x), Math.sin(this.rotation.y), Math.sin(this.rotation.z));
        let cos = new Vector3(Math.cos(this.rotation.x), Math.cos(this.rotation.y), Math.cos(this.rotation.z));

        this.rotationXMatrix = math.matrix([
            [1, 0, 0, 0],
            [0, cos.x, sin.x, 0],
            [0, -sin.x, cos.x, 0],
            [0, 0, 0, 1]
        ])

        this.rotationYMatrix = math.matrix([
            [cos.y, 0, -sin.y, 0],
            [0, 1, 0, 0],
            [sin.y, 0, cos.y, 0],
            [0, 0, 0, 1]
        ])

        this.rotationZMatrix = math.matrix([
            [cos.z, sin.z, 0, 0],
            [-sin.z, cos.z, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ])

        return math.multiply(math.multiply(this.rotationZMatrix, this.rotationYMatrix), this.rotationXMatrix)
    }

    CalculateTranslationMatrix() {
        return math.matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [this.position.x, this.position.y, this.position.z, 1],
        ])
    }

    CalculateScaleMatrix() {
        return math.matrix([
            [this.scale.x, 0, 0, 0],
            [0, this.scale.y, 0, 0],
            [0, 0, this.scale.z, 0],
            [0, 0, 0, 1],
        ]);
    }

    CheckPositionChanged() {
        if (!this.oldPosition.equals(this.position)) {
            this.translateMatrix = this.CalculateTranslationMatrix();
            this.oldPosition = this.position.copy();
            return true;
        }
        return false;
    }

    CheckRotationChanged() {
        if (!this.oldRotation.equals(this.rotation)) {
            this.rotationMatrix = this.CalculateRotationMatrix();
            this.oldRotation = this.rotation.copy();
            return true;
        }
        return false;
    }

    CheckScaleChanged() {

        if (!this.oldScale.equals(this.scale)) {
            this.scaleMatrix = this.CalculateScaleMatrix();
            this.oldScale = this.scale.copy();
            return true;
        }
        return false;
    }

}