import {FreeFormShape} from "../FreeFormShape.js";
import {Vector3} from "./Vector3.js";

/** @type {import('mathjs')}*/

export class TransformObject {

    /** @type {TransformObject|null} */
    parent = null;
    /** @type {TransformObject[]} */
    children = [];
    /** @type {Vector3} */
    rotation;
    /** @type {Vector3} */
    position;
    /** @type {Vector3} */
    scale;
    
    /**
     *
     * @param name : string
     * @param vertices : number[][]
     * @param color : number[][]
     * @param position : number[]/Vector3
     * @param rotation : number[]/Vector3
     * @param scale : number[]/Vector3
     */
    constructor(name, vertices, color, position, rotation, scale) {
        this.name = name;
        this.vertices = FreeFormShape.GetArray(vertices, color);
        this.gpu = WebGPU.Instance;
        if (position instanceof Vector3) {
            this.position = position;
        } else if (Array.isArray(position) && position.length === 3) {
            this.position = Vector3.fromArray(position);
        } else {
            throw new Error('Position must be a Vector3 or array[3]');
        }
        if (rotation instanceof Vector3) {
            this.rotation = rotation;
        } else if (Array.isArray(rotation) && rotation.length === 3) {
            this.rotation = Vector3.fromArray(rotation);
        } else {
            throw new Error('Position must be a Vector3 or array[3]');
        }
        if (scale instanceof Vector3) {
            this.scale = scale;
        } else if (Array.isArray(scale) && scale.length === 3) {
            this.scale = Vector3.fromArray(scale);
        } else {
            throw new Error('Position must be a Vector3 or array[3]');
        }
        this.oldScale = Vector3.Zero.scale(-100);
        this.oldPosition = Vector3.Zero.scale(-100);
        this.oldRotation = Vector3.One.scale(-100);

        this.Ready();
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
    }

    Update() {
        throw new Error("Update Cannot be Empty");
    }

    /**
     * @param child : TransformObject
     */
    AddChild(child) {
        this.children.push(child);
        child.parent = this;
    }

    //--------------
    //Util Functions
    //---------------

    async CalculateMatrix() {
        let changed = false;

        if (this.oldScale.array !== this.scale.array) {
            this.scaleMatrix = math.matrix([
                [this.scale.x, 0, 0, 0],
                [0, this.scale.y, 0, 0],
                [0, 0, this.scale.z, 0],
                [0, 0, 0, 1],
            ]);
            changed = true;
        }

        if (this.oldPosition.array !== this.position.array) {
            this.translateMatrix = math.matrix([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [this.position.x, this.position.y, this.position.z, 1],
            ])

            changed = true;
        }
        if (this.oldRotation.array !== this.rotation.array) {
            this.rotationMatrix = this.CalculateRotationMatrix();
            changed = true;
        }

        if (changed === true)
            this.transformMatrix = math.multiply(math.multiply(this.scaleMatrix, this.rotationMatrix), this.translateMatrix);
        this.oldScale = this.scale;
        this.oldRotation = this.rotation;
        this.oldPosition = this.position;
        return this.transformMatrix;
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

    async CalculateParentMatrix() {
        await this.CalculateMatrix();
        let familyMember = this;
        let matrix = this.transformMatrix;
        while (familyMember.parent !== null) {
            await familyMember.parent.CalculateMatrix();
            familyMember = familyMember.parent;
            matrix = math.multiply(matrix, familyMember.transformMatrix);
        }
        return matrix;
    }

    async WriteToBuffer() {
        let matrix;
        if (this.parent === null) {
            await this.CalculateMatrix();
            matrix = [...math.flatten(this.transformMatrix).toArray()];
        } else {
            let temp = await this.CalculateParentMatrix();
            matrix = [...math.flatten(temp).toArray()];
        }
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
    }

    /**
     * @param pass : GPURenderPassEncoder
     */
    Render(pass) {
        pass.setBindGroup(0, this.bindGroup)
        this.WriteToBuffer();
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / 6);
    }


}