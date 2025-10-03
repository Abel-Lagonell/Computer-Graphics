import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
import {Uniform} from "./Constants.js";

export class PointLight extends Transform {
    constructor(options = {}) {
        const {
            name = "PointLight",
            position = Vector3.Zero.copy(),
            color = Color.White
        } = options;
        super(name, {position: position});
        
        this.color = color;
        this.ambientReflectionConstant= 1;
        this.ambientColor = Color.White;
        this.directionalDirection = new Vector3(1, 0, 0);
        this.directionalColor = [1,1,1,1];
        this.lightIndex = this.gpu.currentPointLight;
        this.gpu.currentPointLight++;

        this.pLightGroup = this.gpu.device.createBindGroup({
            layout: this.gpu.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer: this.gpu.DUMMYUniformBuffer}},
                {binding: 1, resource: {buffer: this.gpu.lightBuffer}},
            ]
        });
        
        if (this.gpu.currentPointLight === 1){
            console.log(this.directionalDirection)
            this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, 0, new Uint8Array(Uniform.LightBuffer));
            this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.ka, new Float32Array([this.ambientReflectionConstant]))
            this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.ia, new Float32Array(this.ambientColor))
            this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.directionalLight, new Float32Array(this.directionalDirection))
            this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.directionalLight+16, new Float32Array(this.directionalColor))
        }

        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, 0 ,new Uint32Array([this.gpu.currentPointLight]))
    }

    _Update() {
    }

    Render(pass) {
        const globalPosition = Vector3.fromArray(math.flatten(math.row(this.globalTransformMatrix, 3)).toArray().slice(0,3));
        pass.setBindGroup(0, this.pLightGroup);


        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.pointLights+32*this.lightIndex), new Float32Array(globalPosition))
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.pointLights+16+32*this.lightIndex), new Float32Array(this.color))
    }
}