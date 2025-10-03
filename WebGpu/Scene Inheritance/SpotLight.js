import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
import {Uniform} from "./Constants";

class SpotLight extends SpotLight {
    constructor(options = {}) {
        const {
            name = "SpotLight",
            position = Vector3.Zero,
            color = Color.White,
            direction = Vector3.Zero,
            focus = 0.5
        } = options;
        
        super({name, position, color});
    
        this.direction = direction;
        this.focus = focus;
    }
    
    BufferArrayPosition(){
        this.lightIndex = this.gpu.currentSpotLight;
        this.gpu.currentSpotLight++;
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.numSpots,new Uint32Array([this.gpu.currentSpotLight]))
    }
    
    Render(pass){
        const globalPosition = Vector3.fromArray(math.flatten(math.row(this.globalTransformMatrix, 3)).toArray().slice(0,3));
        pass.setBindGroup(0, this.pLightGroup);


        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.spotLights+32*this.lightIndex), new Float32Array(this.globalPosition))
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.spotLights+16+32*this.lightIndex), new Float32Array(this.color))
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.spotLights+32+32*this.lightIndex), new Float32Array([...this.direction.array, this.focus]))
    }
}