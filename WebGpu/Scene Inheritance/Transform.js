import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
import {Quaternion} from "./Quaternion.js";
import {Logger} from "../Logger.js";
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

    AngularVelocity = Vector3.Zero.copy();
    LinearVelocity = Vector3.Zero.copy();
    ScalarVelocity = Vector3.Zero.copy();

    oldPosition = Vector3.Empty();
    oldRotation = Vector3.Empty();
    oldScale = Vector3.Empty();
    oldQuaternion = Quaternion.Identity.copy();

    _gpuInitialized = false;

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

        // Initialize quaternion from euler rotation
        this.quaternion = Quaternion.fromEuler(this.rotation);

        this.globalTransformMatrix = this.CalculateMatrix();
        this.vertices = new Float32Array([...this.position.array, ...Color.Black]);

        this._readyPromise = this._initializedWhenReady();
    }

    async _initializedWhenReady() {
        if (this.gpu)
            await this.gpu.WaitForReady();
        this.Ready();
    }

    /**
     * @param cam : Camera
     */
    static setCameraReference(cam) {
        Transform.cameraReference = cam;
    }

    Ready() {
        this.CallInChildren("Ready")
    }

    Update() {
    }

    _Update() {
        this.PhysicsUpdate();
        this.CallInChildren("Update")
        this.CallInChildren("_Update")
    }

    PhysicsUpdate() {
        if (this.AngularVelocity.magnitude() !== 0 || this.AngularVelocity.magnitude() !== 0 || this.ScalarVelocity !== 0) {
            this.markDirty()
        }

        this.rotation = this.rotation.add(this.AngularVelocity);
        this.position = this.position.add(this.LinearVelocity);
        this.scale = this.scale.add(this.ScalarVelocity);
    }

    /**
     * Mark this transform and all children as dirty
     */
    markDirty() {
        this._globalTransformDirty = true;
        this.CallInChildren("markDirty");
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
    async AddChild(child) {
        this.children.push(child);

        if (this.gpu) {
            await this.gpu.WaitForReady();
        }

        await child.WriteToGPU()
        child.parent = this;
        child.markDirty(); // Child's global transform needs recalculation
    }

    /**
     * @param pass : GPURenderPassEncoder
     */
    Render(pass) {
        if (!this._gpuInitialized) return;

        pass.setBindGroup(0, this.bindGroup)
        this.WriteToBuffer()
        if (this.vertexBuffer && this.vertices.length > 6) {
            pass.setVertexBuffer(0, this.vertexBuffer);
            pass.draw(this.vertices.length / 6);
        }
        this.CallInChildren("Render", pass)
    }

    WriteToBuffer() {
        if (!this._gpuInitialized || !this.uniformBuffer) return;

        this.CalculateMatrix();

        if (this.parent !== null) {
            this.CalculateGlobalMatrix();
        } else {
            this.globalTransformMatrix = this.localTransformMatrix;
        }
        let finalMatrix = this.globalTransformMatrix;

        if (Transform.cameraReference !== null) {
            if (this.name === "Green"){
                Logger.continuousLog(
                    Logger.matrixLog(this.globalTransformMatrix)
                    + Logger.matrixLog(Transform.cameraReference.globalTransformMatrix)
                )
            }

            const projectionMatrix = Transform.cameraReference.perspectiveMatrix;
            const cameraMatrix = math.transpose(Transform.cameraReference.globalTransformMatrix);
            const upVector4 = math.multiply(cameraMatrix, [0, 1, 0, 0]);
            const upVector3 = new Vector3(upVector4.get([0]), upVector4.get([1]), upVector4.get([2]));
            const forwardVector4 = math.multiply(cameraMatrix, [0, 0, 1, 0]);
            const forwardVector3 = new Vector3(forwardVector4.get([0]), forwardVector4.get([1]), forwardVector4.get([2]));
            const posVec3 = new Vector3(cameraMatrix.get([0, 3]), cameraMatrix.get([1, 3]), cameraMatrix.get([2, 3])); //"Global" Position

            const viewMatrix = this.getLookAtLH(posVec3, forwardVector3, upVector3);
            const temp = math.multiply(projectionMatrix, viewMatrix);


            finalMatrix = math.multiply(
                this.globalTransformMatrix,
                temp,
            );
        }

        const matrix = [...math.flatten(finalMatrix).toArray()];
        this.gpu.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(matrix))
    }

    /**
     *
     * @param pos : Vector3
     * @param forV : Vector3
     * @param upV : Vector3
     */
    getLookAtLH(pos, forV, upV) {
        const zAxis = forV.normalize();
        const xAxis = upV.cross(forV).normalize();
        const yAxis = xAxis.cross(zAxis);

        return math.transpose(math.matrix([
            [xAxis.x, xAxis.y, xAxis.z, -xAxis.dot(pos)],
            [-yAxis.x, -yAxis.y, -yAxis.z, yAxis.dot(pos)],
            [zAxis.x, zAxis.y, zAxis.z, -zAxis.dot(pos)],
            [0, 0, 0, 1]]
        ));
    }

    async WriteToGPU() {
        // Ensure WebGPU is ready before proceeding
        if (this.gpu) {
            await this.gpu.WaitForReady();
        }

        if (!this.gpu || !this.gpu.device) {
            console.error("GPU device not available for WriteToGPU");
            return;
        }

        try {
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

            if (this.vertices.length > 6) {
                this.vertexBuffer = this.gpu.device.createBuffer({
                    label: this.name,
                    size: this.vertices.byteLength,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                });

                this.gpu.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
            }

            this._gpuInitialized = true;
            this.WriteToBuffer();

            // Initialize children
            for (let child of this.children) {
                await child.WriteToGPU();
            }
        } catch (error) {
            console.error(`Error in WriteToGPU for ${this.name}:`, error);
        }
    }

    CalculateGlobalMatrix() {
        return this.globalTransformMatrix = math.multiply(
            this.CalculateMatrix(),
            this.parent.globalTransformMatrix,
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
            // Use quaternion for rotation matrix
            this.rotationMatrix = this.quaternion.Matrix;
            this.localTransformMatrix = math.multiply(
                this.scaleMatrix,
                this.rotationMatrix,
                this.translateMatrix
            );
            this.markDirty();
        }
        return this.localTransformMatrix;
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
            // Update quaternion when euler angles change
            this.quaternion = Quaternion.fromEuler(this.rotation);
            this.rotationMatrix = this.quaternion.Matrix;

            this.oldRotation = this.rotation.copy();
            this.oldQuaternion = this.quaternion.copy();
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