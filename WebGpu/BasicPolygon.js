class BasicPolygon {
    /**
     * 
     * @param vertices : number[]
     * @param color : number[]
     * @param bufferName : string
     */
    constructor(vertices, color, bufferName) {
        const temporary = new FreeFormShape(vertices, color);
        this.vertices = temporary.GetArray();
        this.bufferName = bufferName;
    }
    
    WriteToGPU(){
        this.vertexBuffer = WebGPU.Instance.device.createBuffer({
            label: this.bufferName,
            size: this.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });

        WebGPU.Instance.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
        
    }
    
    Render(pass){
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length/6);
    }
}