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
    
    writtenAlready = true;
    frame = 0;
    

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
        this.oldScale = Vector3.Empty();
        this.oldPosition = Vector3.Empty();
        this.oldRotation = Vector3.Empty();

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
        for (let child of this.children) {
            child.Update();
        } 
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

    CalculateMatrix() {
        let changed = false;

        if (!this.oldScale.equals(this.scale)) {
            this.scaleMatrix = math.matrix([
                [this.scale.x, 0, 0, 0],
                [0, this.scale.y, 0, 0],
                [0, 0, this.scale.z, 0],
                [0, 0, 0, 1],
            ]);
            changed = true;
            this.oldScale = this.scale.copy();
        }

        if (!this.oldPosition.equals(this.position)) {
            this.translateMatrix = math.matrix([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [this.position.x, this.position.y, this.position.z, 1],
            ])
            this.oldPosition = this.position.copy();
            changed = true;
        }
        if (!this.oldRotation.equals(this.rotation)) {
            this.rotationMatrix = this.CalculateRotationMatrix();
            changed = true;
            this.oldRotation = this.rotation.copy();
        }

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

    WriteToBuffer() {
        this.CalculateMatrix();
        let matrix
        if (this.parent !== null) {
            this.globalTransformMatrix =math.multiply(this.localTransformMatrix, this.parent.globalTransformMatrix);
        }else{
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

        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                child.WriteToGPU();
            } 
        }
    }

    /**
     * @param pass : GPURenderPassEncoder
     */
    Render(pass) {
        pass.setBindGroup(0, this.bindGroup)
        this.WriteToBuffer()
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / 6);
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                child.Render(pass);
            }
        }
    }
    
    LogOnce(string){
        if (this.writtenAlready){
            this.writtenAlready = false;
            console.log(string);
        } 
    }
    
    DebugWriteContinuous(string){
        let debugString = document.getElementById("Debug")
        debugString.innerHTML = string;
    }


}