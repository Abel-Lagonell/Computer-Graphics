import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
//@ts-check
/** @type {import('mathjs')}*/


/**
 * @typedef {Object} TransformOptions
 * @property {Vector3} [position=Vector3.Zero]
 * @property {Vector3} [rotation=Vector3.Zero]
 * @property {Vector3} [scale=Vector3.One]
 */

export class Transform {

    /** @type {Transform|null} */
    parent = null;
    /** @type {Transform[]} */
    children = [];
    /** @type {Camera/null}*/
    static cameraReference = null;

    isCameraChild = false;
    isCameraSibling = false;
    isCameraParent = false;

    oldPosition = Vector3.Empty();
    oldRotation = Vector3.Empty();
    oldScale = Vector3.Empty();

    /**
     *
     * @param name : string
     * @param {TransformOptions} [options={}] - Optional transform parameters
     */
    constructor(name, options = {}) {
        this.name = name;
        this.gpu = WebGPU.Instance;

        const {
            position = Vector3.Zero.copy(),
            rotation = Vector3.Zero.copy(),
            scale = Vector3.One.copy()
        } = options;

        this.position = position;
        this.rotation = rotation;
        this.scale = scale;

        this.globalTransformMatrix = this.CalculateMatrix();
        this.vertices = new Float32Array([...this.position.array, ...Color.Black]);
        this.Ready();
    }

    /**
     * @param cam : Camera
     */
    static setCameraReference(cam) {
        Transform.cameraReference = cam;
    }

    get Forward() {
        this.CheckRotationChanged();
        return math.cross(this.rotationZMatrix,
            math.cross(this.rotationYMatrix,
                math.cross(this.rotationXMatrix, [0, 0, 1, 0])))
    }

    get Right() {
        this.CheckRotationChanged();
        return math.cross(this.rotationZMatrix,
            math.cross(this.rotationYMatrix,
                math.cross(this.rotationXMatrix, [1, 0, 0, 0])))
    }

    get Up() {
        this.CheckRotationChanged();
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

        if (this.isCameraChild) {
            // If parent is already a camera child, make the new child also a camera child
            child.SetCameraChild();
        } else if (child.isCameraChild) {
            // If the child being added is a camera child, parent becomes camera parent
            this.isCameraParent = true;
            // All existing children become camera siblings
            this.CallInChildren("SetCameraSibling");
        } else if (this.isCameraParent) {
            // If parent is already a camera parent, new non-camera child becomes sibling
            child.SetCameraSibling();
        }
    }

    SetCameraChild() {
        this.isCameraChild = true;
        this.CallInChildren("SetCameraChild")
    }

    SetCameraSibling() {
        if (this.isCameraChild) return;
        this.isCameraSibling = true;
        this.CallInChildren("SetCameraSibling")
    }

    /**
     * @param pass : GPURenderPassEncoder
     */
    Render(pass) {
        pass.setBindGroup(0, this.bindGroup)
        this.WriteToBuffer()
        if (this.vertexBuffer && this.vertices.length > 6) {
            pass.setVertexBuffer(0, this.vertexBuffer);
            pass.draw(this.vertices.length / 6);
        }
        this.CallInChildren("Render", pass)
    }

    WriteToBuffer() {
        this.CalculateMatrix();
        let matrix
        if (this.parent !== null && !this.parent.isCameraChild) {
            this.CalculateGlobalMatrix();
        } else {
            this.globalTransformMatrix = this.localTransformMatrix;
        }
        if (Transform.cameraReference !== null && !this.isCameraChild) {
            // Use identity matrix to skip transformations for siblings
            const identityMatrix = math.identity(4);

            const positionMatrix = this.isCameraSibling ? identityMatrix : Transform.cameraReference.globalPositionMatrix;
            const rotationMatrix = this.isCameraSibling ? identityMatrix : Transform.cameraReference.globalRotationMatrix;

            this.globalTransformMatrix = math.multiply(
                math.multiply(
                    math.multiply(
                        this.globalTransformMatrix,
                        positionMatrix
                    ),
                    rotationMatrix
                ),
                Transform.cameraReference.perspectiveMatrix
            )
        }

        matrix = [...math.flatten(this.globalTransformMatrix).toArray()];
        this.gpu.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(matrix))
    }

    WriteToGPU() {
        this.uniformBufferSize = 4 * 4 * 4; // 4 columns * 4 rows * 4 bytes


        /** @type {GPUBuffer}*/
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

        if (this.vertices.length > 6) {
            this.vertexBuffer = this.gpu.device.createBuffer({
                label: this.name,
                size: this.vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });

            this.gpu.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
        }

        this.CallInChildren("WriteToGPU")
    }

    CalculateGlobalMatrix() {
        return this.globalTransformMatrix = math.multiply(
            this.parent.globalTransformMatrix,
            this.CalculateMatrix()
        );
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
            [0, cos.x, -sin.x, 0],
            [0, sin.x, cos.x, 0],
            [0, 0, 0, 1]
        ])

        this.rotationYMatrix = math.matrix([
            [cos.y, 0, sin.y, 0],
            [0, 1, 0, 0],
            [-sin.y, 0, cos.y, 0],
            [0, 0, 0, 1]
        ])

        this.rotationZMatrix = math.matrix([
            [cos.z, -sin.z, 0, 0],
            [sin.z, cos.z, 0, 0],
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

    get globalPosition() {
        this.CalculateGlobalMatrix();

        return new Vector3(
            math.subset(this.globalTransformMatrix, math.index(3, 0)),
            math.subset(this.globalTransformMatrix, math.index(3, 1)),
            math.subset(this.globalTransformMatrix, math.index(3, 2))
        );
    }

    get globalPositionMatrix() {
        this.CalculateGlobalMatrix();

        let x = math.subset(this.globalTransformMatrix, math.index(3, 0));
        let y = math.subset(this.globalTransformMatrix, math.index(3, 1));
        let z = math.subset(this.globalTransformMatrix, math.index(3, 2))


        return math.matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [x, y, z, 1],
        ])

    }

    get globalRotation() {
        this.CalculateGlobalMatrix();

        // Extract the 3x3 rotation part from the matrix
        const m11 = math.subset(this.globalTransformMatrix, math.index(0, 1));
        const m12 = math.subset(this.globalTransformMatrix, math.index(0, 2));
        const m13 = math.subset(this.globalTransformMatrix, math.index(0, 3));
        const m21 = math.subset(this.globalTransformMatrix, math.index(1, 0));
        const m22 = math.subset(this.globalTransformMatrix, math.index(1, 1));
        const m23 = math.subset(this.globalTransformMatrix, math.index(1, 2));
        const m31 = math.subset(this.globalTransformMatrix, math.index(2, 0));
        const m32 = math.subset(this.globalTransformMatrix, math.index(2, 1));
        const m33 = math.subset(this.globalTransformMatrix, math.index(2, 2));

        let rotX, rotY, rotZ;

        const sy = Math.sqrt(m11 * m11 + m21 * m21);
        const singular = sy < 1e-6;

        if (!singular) {
            rotX = Math.atan2(m32, m33);
            rotY = Math.atan2(-m31, sy);
            rotZ = Math.atan2(m21, m11);
        } else {
            rotX = Math.atan2(-m23, m22);
            rotY = Math.atan2(-m31, sy);
            rotZ = 0;
        }

        return new Vector3(rotX, rotY, rotZ);
    }

    get globalRotationMatrix() {
        const m11 = math.subset(this.globalTransformMatrix, math.index(0, 0));
        const m12 = math.subset(this.globalTransformMatrix, math.index(0, 1));
        const m13 = math.subset(this.globalTransformMatrix, math.index(0, 2));
        const m21 = math.subset(this.globalTransformMatrix, math.index(1, 0));
        const m22 = math.subset(this.globalTransformMatrix, math.index(1, 1));
        const m23 = math.subset(this.globalTransformMatrix, math.index(1, 2));
        const m31 = math.subset(this.globalTransformMatrix, math.index(2, 0));
        const m32 = math.subset(this.globalTransformMatrix, math.index(2, 1));
        const m33 = math.subset(this.globalTransformMatrix, math.index(2, 2));

        // Calculate scale factors to normalize
        const scaleX = Math.sqrt(m11 * m11 + m21 * m21 + m31 * m31);
        const scaleY = Math.sqrt(m12 * m12 + m22 * m22 + m32 * m32);
        const scaleZ = Math.sqrt(m13 * m13 + m23 * m23 + m33 * m33);

        // Create normalized rotation matrix (4x4 for consistency with your system)
        return math.matrix([
            [m11 / scaleX, m12 / scaleY, m13 / scaleZ, 0],
            [m21 / scaleX, m22 / scaleY, m23 / scaleZ, 0],
            [m31 / scaleX, m32 / scaleY, m33 / scaleZ, 0],
            [0, 0, 0, 1]
        ]);
    }


}