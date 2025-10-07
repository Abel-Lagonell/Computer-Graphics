import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
import {Uniform} from "./Constants.js";
import {Logger} from "../Logger.js";

export class PointLight extends Transform {

    /**
     * Format: [r,g,b, intensity]
     * @type {number[]}
     */
    static ambientColor = [1, 1, 1, 0.1];
    /**
     * Direction of the directional Light
     * @type {Vector3}
     */
    static directionalDirection = new Vector3(-1, -1, 2);
    /**
     * Format: [r,g,b, intensity]
     * @type {number[]}
     */
    static directionalColor = [1, 1, 1, 0.2];


    constructor(options = {}) {
        const {
            name = "PointLight",
            position = Vector3.Zero.copy(),
            color = Color.White
        } = options;
        super(name, {position: position});

        this.color = color;
        this.BufferArrayPosition().then(() => {
                this.pLightGroup = this.gpu.device.createBindGroup({
                    layout: this.gpu.pipeline.getBindGroupLayout(0),
                    entries: [
                        {binding: 0, resource: {buffer: this.gpu.DUMMYUniformBuffer}},
                        {binding: 1, resource: {buffer: this.gpu.lightBuffer}},
                    ]
                });

                if (this.gpu.currentPointLight === 1 || this.gpu.currentSpotLight === 1) {
                    this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.ambientColor, new Float32Array(PointLight.ambientColor))
                    this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.directionalLight, new Float32Array(PointLight.directionalDirection))
                    this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, Uniform.LightIndex.directionalLight + 16, new Float32Array(PointLight.directionalColor))
                }
            }
        )


    }
    
       async BufferArrayPosition() {
        if (this.gpu) {
            await this.gpu.WaitForReady();
        }
        this.lightIndex = this.gpu.currentPointLight;
        this.gpu.currentPointLight++;
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, 0, new Uint32Array([this.gpu.currentPointLight]))
    }

    Render(pass) {
        this.CalculateMatrix();
        this.CalculateGlobalMatrix()
        pass.setBindGroup(0, this.pLightGroup);

        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.pointLights + 32 * this.lightIndex), new Float32Array(this.globalPosition))
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (Uniform.LightIndex.pointLights + 16 + 32 * this.lightIndex), new Float32Array(this.color))
        
        this.CallInChildren("Render", pass)
    }
}