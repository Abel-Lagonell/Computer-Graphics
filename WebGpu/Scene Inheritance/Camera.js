import {Transform} from "./Transform.js";

class Camera extends Transform{
    constructor() {
        super();
        this.camBuffer = this.gpu.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
    }
    
    Update(){}
    
    WriteToBuffer() {
    }

    Render(commandPass) {
        
        this.camGroup = this.gpu.device.createBindGroup({
            layout: this.gpu.pipeline.getBindGroupLayout(1),
            entries: [{binding: 0, resource: {buffer: this.camBuffer}}]
        });
        commandPass.setBindGroup(1, this.camGroup);
        this.gpu.device.queue.writeBuffer(this.camBuffer, 0, new Float32Array(this.position))
        this.gpu.device.queue.writeBuffer(this.camBuffer, 16, new Float32Array(this.rotation))
    }
}