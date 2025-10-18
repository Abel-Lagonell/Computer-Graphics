import {AmbientLight} from "./AmbientLight.js";
import {Vector3} from "../Vector3.js";
import {Uniform} from "../Constants.js";

export class DirectionalLight extends AmbientLight {
    static Instance = null;

    constructor(options = {}) {

        const {
            name = "DirectionalLight",
            color = [1, 1, 1, 1],
            rotation = new Vector3(-Math.PI / 4, Math.PI, 0)
        } = options;

        super({...options, name: name, color: color, rotation: rotation});

        if (DirectionalLight.Instance === null) {
            DirectionalLight.Instance = this;
            this.SetBuffer();
        }
    }

    SetBuffer() {
        const direction = this.quaternion.rotateVector(Vector3.Forward)

        // Only bind directional light data
        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            Uniform.LightIndex.directionalLight,
            new Float32Array(direction));

        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            Uniform.LightIndex.directionalLight + 16,
            new Float32Array(this.color));
    }

    static getDirectionalLightMatrix() {
        const lightDir = this.Instance?.position?.normalize() || new Vector3(-1, -1, 2).normalize();
        const lightPos = lightDir.scale(-30);

        const target = new Vector3(0, 0, 0);
        const up = Math.abs(lightDir.y) > 0.999 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);

        const forward = target.subtract(lightPos).normalize();
        const right = forward.cross(up).normalize();
        const upCorrected = right.cross(forward).normalize();

        const viewMatrix = math.matrix([
            [right.x, right.y, right.z, 0],
            [upCorrected.x, upCorrected.y, upCorrected.z, 0],
            [-forward.x, -forward.y, -forward.z, 0],
            [-right.dot(lightPos), -upCorrected.dot(lightPos), forward.dot(lightPos), 1]
        ]);

        const size = 0.0001;
        const near = 0.0001;
        const far = 5000;

        const projectionMatrix = math.matrix([
            [1 / size, 0, 0, 0],
            [0, 1 / size, 0, 0],
            [0, 0, 2 / (far - near), 0],
            [0, 0, -(far + near) / (far - near), 1]
        ]);

        return math.multiply(viewMatrix, projectionMatrix);
    }
}