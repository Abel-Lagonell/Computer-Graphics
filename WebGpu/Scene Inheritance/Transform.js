import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
import {Quaternion} from "./Quaternion.js";
import {WebGPU} from "../WebGPU.js";
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
    _globalTransformDirty = true;

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
        if (this.AngularVelocity.magnitude() !== 0 || this.LinearVelocity.magnitude() !== 0 || this.ScalarVelocity.magnitude() !== 0) {
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
        //[x,y,z,r,g,b,a,nx,ny,nz,sExp,sx,sy,sz]
        if (this.vertexBuffer && this.vertices.length > 14) {
            pass.setVertexBuffer(0, this.vertexBuffer);
            pass.draw(this.vertices.length / 14);
        }
        this.CallInChildren("Render", pass)
    }

    WriteToBuffer() {
        if (!this._gpuInitialized || !this.uniformBuffer) return;

        // Calculate local matrix first
        this.CalculateMatrix();

        // Calculate global transform matrix (world space)
        this.CalculateGlobalMatrix();

        let clipSpaceMatrix = this.globalTransformMatrix;
        let worldSpaceMatrix = this.globalTransformMatrix;
        let normalMatrix = this.globalTransformMatrix;

        if (Transform.cameraReference !== null) {
            const projectionMatrix = Transform.cameraReference.perspectiveMatrix;
            const globalMatrix = Transform.cameraReference.globalTransformMatrix;
            const upVector3 = new Vector3(globalMatrix.get([1, 0]), globalMatrix.get([1, 1]), globalMatrix.get([1, 2]));
            const forwardVector3 = new Vector3(globalMatrix.get([2, 0]), globalMatrix.get([2, 1]), globalMatrix.get([2, 2]));
            const posVec3 = new Vector3(globalMatrix.get([3, 0]), globalMatrix.get([3, 1]), globalMatrix.get([3, 2]));

            const viewMatrix = this.getLookAtLH(posVec3, forwardVector3, upVector3);

            clipSpaceMatrix = math.multiply(
                this.globalTransformMatrix,
                viewMatrix,
                projectionMatrix,
            );
        }

        const cameraPosition = [...Transform.cameraReference.globalPosition.array]
        const clipMatrix = [...math.flatten(clipSpaceMatrix).toArray()];
        const worldMatrix = [...math.flatten(worldSpaceMatrix).toArray()];
        const normMatrix = [...math.flatten(normalMatrix).toArray()];
        
        const combinedData = new Float32Array([...clipMatrix, ...worldMatrix, ...normMatrix, ...cameraPosition]);

        this.gpu.device.queue.writeBuffer(this.uniformBuffer, 0, combinedData);
    }

    /**
     *
     * @param pos : Vector3
     * @param forward : Vector3
     * @param up : Vector3
     */
    getLookAtLH(pos, forward, up) {
        var zAxis = forward.normalize();
        var xAxis = up.cross(forward).normalize();
        var yAxis = xAxis.cross(zAxis);

        return math.matrix([
            [xAxis.x, -yAxis.x, zAxis.x, 0],
            [xAxis.y, -yAxis.y, zAxis.y, 0],
            [xAxis.z, -yAxis.z, zAxis.z, 0],
            [-xAxis.dot(pos), yAxis.dot(pos), -zAxis.dot(pos), 1]
        ]);
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
            this.uniformBufferSize = 4 * 4 * 4 * 3 + 16; // 4 columns * 4 rows * 4 bytes

            /** @type {GPUBuffer}*/
            this.uniformBuffer = this.gpu.device.createBuffer({
                size: this.uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });

            this.bindGroup = this.gpu.device.createBindGroup({
                layout: this.gpu.pipeline.getBindGroupLayout(0),
                entries: [
                    {binding: 0, resource: {buffer: this.uniformBuffer}},
                    {binding: 1, resource: {buffer: this.gpu.lightBuffer}},
                ]
            });

            if (this.vertices.length > 14) {
                this.vertexBuffer = this.gpu.device.createBuffer({
                    label: this.name,
                    size: this.vertices.byteLength,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
                });

                this.gpu.device.queue.writeBuffer(this.vertexBuffer, 0, new Float32Array(this.vertices));
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

    get globalPosition(){
        return Vector3.fromArray(math.flatten(math.row(this.globalTransformMatrix, 3)).toArray().slice(0,3));
    }

    CalculateGlobalMatrix() {
        if (this.parent !== null) {
            // Child's global = Parent's global * Child's local
            this.globalTransformMatrix = math.multiply(
                this.localTransformMatrix,
                this.parent.globalTransformMatrix,
            );
            
            this.globalNormalMatrix = math.multiply(
                this.localNormalMatrix,
                this.parent.globalNormalMatrix,
            )
        } else {
            // Root object - global matrix equals local matrix
            this.globalTransformMatrix = this.localTransformMatrix;
            this.globalNormalMatrix = this.localNormalMatrix;
        }

        this._globalTransformDirty = false;
        return this.globalTransformMatrix;
    }

    CalculateMatrix() {
        let changed = false;

        if (this.CheckScaleChanged())
            changed = true;

        if (this.CheckPositionChanged())
            changed = true;

        if (this.CheckRotationChanged())
            changed = true;

        if (changed || !this.localTransformMatrix) {
            this.localTransformMatrix = math.multiply(
                this.scaleMatrix,
                this.rotationMatrix,
                this.translateMatrix,
            );
            const invScale = math.matrix([
                [1/this.scale.x, 0, 0, 0],
                [0, 1/this.scale.y, 0, 0],
                [0, 0, 1/this.scale.z, 0],
                [0, 0, 0, 1],
            ]); 
            
            this.localNormalMatrix = math.multiply(invScale, this.rotationMatrix);
            
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