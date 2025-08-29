class BasicPolygon {
    /**
     *
     * @param vertices : number[][]
     * @param color : number[][]
     * @param bufferName : string
     * @param position : number[]
     */
    constructor(vertices, color, bufferName, position) {
        const temporary = new FreeFormShape(vertices, color);
        this.vertices = temporary.GetArray();
        this.bufferName = bufferName;
        this.GPU = WebGPU.Instance;
        if (position.length > 3 || position.length < 2) {
            throw new Error('Invalid Position');
        }
        this.pos = position;
    }

    WriteToGPU() {
        this.uniformBufferSize = 12; // vec2

        this.uniformBuffer = this.GPU.device.createBuffer({
            size: this.uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.bindGroup = this.GPU.device.createBindGroup({
            layout: this.GPU.pipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer: this.uniformBuffer}},
            ]
        });

        this.vertexBuffer = WebGPU.Instance.device.createBuffer({
            label: this.bufferName,
            size: this.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });

        WebGPU.Instance.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);

    }

    /**
     *
     * @param pass : GPURenderPassEncoder
     */
    Render(pass) {
        pass.setBindGroup(0, this.bindGroup)
        this.GPU.device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(this.pos));
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / 6);
    }
}