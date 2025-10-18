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
}