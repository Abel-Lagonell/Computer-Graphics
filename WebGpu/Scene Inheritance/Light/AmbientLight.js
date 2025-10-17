import {Transform} from "../Transform.js";
import {Uniform} from "../Constants.js";

export class AmbientLight extends Transform {
    static Instance = null;

    constructor(options = {}) {
        
        const {
            name = "AmbientLight",
            color = [1, 1, 1, 0.5]
        } = options;
        
        if (options === {}) 
            options ={
            name: name,
                color: color,
            }

        super(name, options);

        if (AmbientLight.Instance !== null)
            return;
        
        this.lightColor = color;

        this.SetBuffer();
    }

    SetBuffer() {
        AmbientLight.Instance = this;
        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            Uniform.LightIndex.ambientColor,
            new Float32Array(this.lightColor));
    }
}