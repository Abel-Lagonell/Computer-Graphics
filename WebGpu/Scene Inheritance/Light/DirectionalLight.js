import {AmbientLight} from "./AmbientLight.js";
import {Vector3} from "../Vector3.js";
import {Uniform} from "../Constants.js";
import {Quaternion} from "../Quaternion.js";

export class DirectionalLight extends AmbientLight {
    /**@type null/DirectionalLight */
    static Instance = null;

    constructor(options = {}) {

        const {
            name = "DirectionalLight",
            color = [1, 1, 1, 1],
            rotation = new Vector3(-Math.PI / 4, Math.PI, 0)
        } = options;

        super({...options, name: name, color: color, rotation: rotation});


        if (DirectionalLight.Instance === null) {
            this.CalculateMatrix()
            this.CalculateGlobalMatrix()
            this.direction = this.quaternion.rotateVector(Vector3.Forward)
            DirectionalLight.Instance = this;
            this.SetBuffer();
            console.log(this.viewMatrix)
        }
    }

    SetBuffer() {
        this.direction = this.quaternion.rotateVector(Vector3.Forward)

        // Only bind directional light data
        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            Uniform.LightIndex.directionalLight,
            new Float32Array(this.direction));

        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            Uniform.LightIndex.directionalLight + 16,
            new Float32Array(this.color));
    }

    static getDirectionalLightMatrix() {
        if (DirectionalLight.Instance === null) {
            return math.matrix([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1],
            ])
        }

        const dirLight = this.Instance

        const globalMatrix = dirLight.globalTransformMatrix;
        const upVector3 = new Vector3(globalMatrix.get([1, 0]), globalMatrix.get([1, 1]), globalMatrix.get([1, 2]));
        const forwardVector3 = new Vector3(globalMatrix.get([2, 0]), globalMatrix.get([2, 1]), globalMatrix.get([2, 2]));
        const posVec3 = dirLight.direction.scale(-100)

        const viewMatrix = this.getLookAtLH(posVec3, forwardVector3, upVector3)

        const near = 0.001;
        const far = 5000
        const right = 0.001
        const left = -0.001
        const top = 0.00
        const bottom = -0.001

        const projectionMatrix = math.matrix([
            [(2 * near) / (right - left), 0, 0, 0],
            [0, 2 * near / (top - bottom), 0, 0],
            [(right + left) / (right - left), (top + bottom) / (top - bottom), (far + near) / (far - near), 1],
            [0, 0, 2 * far * near / (far - near), 1]
        ]);

        return math.multiply(viewMatrix, projectionMatrix);
    }
}