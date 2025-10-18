import {Transform} from "../Transform.js";
import {Vector3} from "../Vector3.js";
import {Color} from "../Color.js";
import {Uniform} from "../Constants.js";
import {DirectionalLight} from "./DirectionalLight.js";

export class PointLight extends DirectionalLight {


    constructor(options = {}) {
        const {
            name = "PointLight",
            position = Vector3.Zero.copy(),
            color = Color.White
        } = options;
        super({...options, name: name, position: position, color: color});


        this.BufferArrayPosition().then(() => {
            this.pLightGroup = this.gpu.device.createBindGroup({
                layout: this.gpu.pipeline.getBindGroupLayout(0),
                entries: [
                    {binding: 0, resource: {buffer: this.gpu.DUMMYUniformBuffer}},
                    {binding: 1, resource: {buffer: this.gpu.lightBuffer}},
                ]
            });
        })


    }

    SetBuffer() {
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

        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            (Uniform.LightIndex.pointLights + 32 * this.lightIndex),
            new Float32Array(this.globalPosition)
        )
        this.gpu.device.queue.writeBuffer(
            this.gpu.lightBuffer,
            (Uniform.LightIndex.pointLights + 16 + 32 * this.lightIndex),
            new Float32Array(this.color)
        )

        this.CallInChildren("Render", pass)
    }
}