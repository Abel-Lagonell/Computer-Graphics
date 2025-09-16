import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
import {Logger} from "../Logger.js";
import {Quaternion} from "./Quaternion.js";
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
    isCamera = false;
    
    AngularVelocity = Vector3.Zero.copy();
    LinearVelocity = Vector3.Zero.copy();
    ScalarVelocity = Vector3.Zero.copy();

    oldPosition = Vector3.Empty();
    oldRotation = Vector3.Empty();
    oldScale = Vector3.Empty();
    oldQuaternion = Quaternion.Identity.copy();

    // Cache for global transforms
    /** @type {Vector3|null}*/
    _globalPosition = null;
    /** @type {Quaternion|null}*/
    _globalQuaternion = null;
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
        // Use quaternion to rotate the forward vector (0, 0, 1)
        return this._rotateVectorByQuaternion(new Vector3(0, 0, 1), this.quaternion);
    }

    get Right() {
        this.CheckRotationChanged();
        // Use quaternion to rotate the right vector (1, 0, 0)
        return this._rotateVectorByQuaternion(new Vector3(1, 0, 0), this.quaternion);
    }

    get Up() {
        this.CheckRotationChanged();
        // Use quaternion to rotate the up vector (0, 1, 0)
        return this._rotateVectorByQuaternion(new Vector3(0, 1, 0), this.quaternion);
    }

    // Global direction vectors (useful for world-space calculations)
    get GlobalForward() {
        this._updateGlobalTransforms();
        return this._rotateVectorByQuaternion(new Vector3(0, 0, 1), this.globalQuaternion);
    }

    get GlobalRight() {
        this._updateGlobalTransforms();
        return this._rotateVectorByQuaternion(new Vector3(1, 0, 0), this.globalQuaternion);
    }

    get GlobalUp() {
        this._updateGlobalTransforms();
        return this._rotateVectorByQuaternion(new Vector3(0, 1, 0), this.globalQuaternion);
    }

    Ready() {
        this.CallInChildren("Ready")
    }

    Update() {
    }
    
    _Update(){
        this.PhysicsUpdate();
        this.CallInChildren("Update")
        this.CallInChildren("_Update")
    }

    PhysicsUpdate() {
        if (this.AngularVelocity.magnitude() !== 0 || this.AngularVelocity.magnitude() !== 0 || this.ScalarVelocity !== 0) {
            this.markDirty()
        }
        
        this.rotation= this.rotation.add(this.AngularVelocity);
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
    AddChild(child) {
        this.children.push(child);
        child.parent = this;
        child.markDirty(); // Child's global transform needs recalculation

        if (child.isCamera) {
            // If the child being added is a camera child, parent becomes camera parent
            this.isCameraParent = true;
            // All existing children become camera siblings
            this.CallInChildren("SetCameraSibling");
        } else if (this.isCameraParent) {
            // If parent is already a camera parent, new non-camera child becomes sibling
            child.SetCameraSibling();
        } else if (this.isCamera) {
            child.SetCameraChild();
        }
    }

    SetCameraChild() {
        this.isCameraChild = true;
    }

    SetCameraSibling() {
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

        if (this.parent !== null) {
            this.CalculateGlobalMatrix();
        } else {
            this.globalTransformMatrix = this.localTransformMatrix;
        }

        if (Transform.cameraReference !== null) {
            let positionMatrix = math.identity(4);
            let rotationMatrix = math.identity(4);

            if (this.isCameraSibling) {
                //LEAVE THIS ALONE
                this.globalTransformMatrix = this.localTransformMatrix
                
                if (!this.parent.quaternion.equals(Transform.cameraReference.quaternion)) {
                    positionMatrix = this.parent.globalRotationMatrix
                }
                
                if (this.parent?.LinearVelocity.magnitude() !== 0) {
                    positionMatrix = this.parent.globalPositionMatrix;
                } 
            } else if (this.isCameraChild) {
                this.globalTransformMatrix = this.localTransformMatrix;
            } else {
                positionMatrix = Transform.cameraReference.globalPositionMatrix;
                rotationMatrix = Transform.cameraReference.globalRotationMatrix;
            }

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
            this.parent ? this.parent.globalTransformMatrix : math.identity(4),
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
            // Use quaternion for rotation matrix
            this.rotationMatrix = this.quaternion.Matrix;
            this.localTransformMatrix = math.multiply(
                math.multiply(this.scaleMatrix, this.rotationMatrix),
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

    /**
     * Calculate global transforms using quaternions (cached for performance)
     */
    _updateGlobalTransforms() {
        if (!this._globalTransformDirty) return;

        if (this.parent) {
            this.parent._updateGlobalTransforms();

            // Calculate global position
            const parentGlobalQuat = this.parent.globalQuaternion;
            const rotatedLocalPos = this._rotateVectorByQuaternion(this.position, parentGlobalQuat);
            this._globalPosition = this.parent.globalPosition.add(rotatedLocalPos);

            // Calculate global rotation
            this._globalQuaternion = this.parent.globalQuaternion.multiply(this.quaternion);
        } else {
            this._globalPosition = this.position.copy();
            this._globalQuaternion = this.quaternion.copy();
        }

        this._globalTransformDirty = false;
    }

    /**
     * Rotate a vector by a quaternion
     * @param {Vector3} vector
     * @param {Quaternion} quaternion
     * @returns {Vector3}
     */
    _rotateVectorByQuaternion(vector, quaternion) {
        const qx = quaternion.x, qy = quaternion.y, qz = quaternion.z, qw = quaternion.w;
        const vx = vector.x, vy = vector.y, vz = vector.z;

        // Calculate quat * vector * quat_conjugate
        const uvx = qy * vz - qz * vy;
        const uvy = qz * vx - qx * vz;
        const uvz = qx * vy - qy * vx;

        const uuvx = qy * uvz - qz * uvy;
        const uuvy = qz * uvx - qx * uvz;
        const uuvz = qx * uvy - qy * uvx;

        return new Vector3(
            vx + ((uvx * qw) + uuvx) * 2,
            vy + ((uvy * qw) + uuvy) * 2,
            vz + ((uvz * qw) + uuvz) * 2
        );
    }

    get globalPosition() {
        this._updateGlobalTransforms();
        return this._globalPosition;
    }

    get globalQuaternion() {
        this._updateGlobalTransforms();
        return this._globalQuaternion;
    }

    get globalPositionMatrix() {
        const pos = this.globalPosition;
        return math.matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [pos.x, pos.y, pos.z, 1],
        ])
    }

    get globalRotation() {
        // Convert quaternion back to Euler for compatibility
        return this.globalQuaternion.Euler;
    }

    get globalRotationMatrix() {
        return this.globalQuaternion.Matrix;
    }

    
}