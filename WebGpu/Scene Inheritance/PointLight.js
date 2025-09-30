import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";

export class PointLight extends Transform {
    constructor(options = {}) {
        const {
            name = "PointLight",
            position = Vector3.Zero.copy(),
            color = Color.White
        } = options;

        super(name, {position: position});
        this.color = color;
        this.lightIndex = this.gpu.currentPointLight;
        this.gpu.currentPointLight++;

        this.pLightGroup = this.gpu.device.createBindGroup({
            layout: this.gpu.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer: this.gpu.DUMMYUniformBuffer}},
                {binding: 1, resource: {buffer: this.gpu.lightBuffer}},
            ]
        });

        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, 0, new Uint8Array(336));
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, 0 ,new Uint32Array([this.lightIndex+1]))
    }

    _Update() {
    }

    Render(pass) {
        pass.setBindGroup(0, this.pLightGroup);

        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (16+32*this.lightIndex), new Float32Array(this.position))
        this.gpu.device.queue.writeBuffer(this.gpu.lightBuffer, (32+32*this.lightIndex), new Float32Array(this.color))
    }
}