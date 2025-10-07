import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
import {Uniform} from "./Constants.js";
import {PointLight} from "./PointLight.js";
import {Logger} from "../Logger.js";

export class SpotLight extends PointLight {
    constructor(options = {}) {
        const {
            name = "SpotLight",
            position = Vector3.Zero,
            color = Color.White,
            direction = Vector3.Down,
            focus = 0.5
        } = options;
        
        super({name, position, color});
    
        this.direction = direction;
        this.focus = focus;
    }
    
    async BufferArrayPosition(){
        if (this.gpu){
            await this.gpu.WaitForReady();
        } 
        this.lightIndex = this.gpu.currentSpotLight;
        this.gpu.currentSpotLight++;
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.numSpots,new Uint32Array([this.gpu.currentSpotLight]))
    }

    Render(pass){
        this.CalculateMatrix();
        this.CalculateGlobalMatrix();
        pass.setBindGroup(0, this.pLightGroup);


        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.spotLights+32*this.lightIndex), new Float32Array(this.globalPosition))
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.spotLights+16+32*this.lightIndex), new Float32Array(this.color))
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.spotLights+32+32*this.lightIndex), new Float32Array([...this.direction.array, this.focus]))
        
        this.CallInChildren("Render", pass)
    }
}