import {Transform} from "../Transform.js";
import {Uniform} from "../Constants.js";

export class AmbientLight extends Transform {
    static Instance = null;

    constructor(options = {}) {
        
        const {
            name = "AmbientLight",
            color = [1, 1, 1, 0.5]
        } = options;
        
        super(name, options);
        this.color = color;

        if (AmbientLight.Instance === null){
            AmbientLight.Instance = this;
            this.SetBuffer()
        }

    }

    SetBuffer() {
        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            Uniform.LightIndex.ambientColor,
            new Float32Array(this.color));
    }
}