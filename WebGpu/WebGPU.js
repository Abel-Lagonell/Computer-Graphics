class WebGPU {
    /**
     * @type WebGPU
     */
    static Instance;

    constructor() {
        if (WebGPU.Instance != null) {
            WebGPU.Instance = this;
        }
        this.isReady = false;
        this.SetUpGPU().then(() => {
            this.SlowStart()
        })
        /**
         * 
         * @type {BasicPolygon[]}
         */
        this.shapes = [];
    }

    /**
     * 
     * @param shape : BasicPolygon
     */
    AddShape(shape) {
        this.shapes.push(shape);
    }

    async SlowStart() {
        this.RenderAll();
    }

    async SetUpGPU() {
        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error("No Appropiate GPUAdapter found");
        }
        this.device = await this.adapter.requestDevice();
        if (!this.device) {
            throw new Error("need a browser that supports WebGPU");
            return;
        }
        console.log("WebGPU device found");

        this.canvas = document.querySelector("canvas");
        this.context = this.canvas.getContext("webgpu");
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure(
            {
                device: this.device,
                format: this.presentationFormat
            }
        );
        console.log("Created context with device and format");

        this.cellShaderModule = this.device.createShaderModule({
            label: "Simple Shader",
            code: `
                    struct UniformCoordinates{
                        offset: vec2f
                    }
                    
                    @group(0) @binding(0) var<uniform> myCords: UniformCoordinates;
                    
                    struct ColorVarying 
                    {
                        @builtin(position) position: vec4f,
                        @location(0) color: vec3f,
                    };
                    
                    @vertex
                    fn vertexMain(@location(0) pos:vec3f, @location(1) col: vec3f) -> ColorVarying
                    {
                        var returnMe: ColorVarying;
                        returnMe.position = vec4(pos,1);
                        returnMe.color = col;
                        return returnMe;
                    }

                    @fragment
                    fn fragmentMain(fsInput:ColorVarying) -> @location(0) vec4f
                    {
                        return vec4f(fsInput.color, 1);
                    }
                `
        })

        console.log("Created Simple Shader!")

        this.vertexBufferLayout = {
            arrayStride: 4 * 6,
            attributes: [
                {
                    format: "float32x3",
                    offset: 0,
                    shaderLocation: 0,
                },
                {
                    format: "float32x3",
                    offset: 3 * 4,
                    shaderLocation: 1,
                }
            ]
        }


        this.pipeline = this.device.createRenderPipeline(
            {
                label: "Simple Pipeline",
                layout: "auto",
                vertex: {
                    module: this.cellShaderModule,
                    entryPoint: "vertexMain",
                    buffers: [this.vertexBufferLayout]
                },
                fragment: {
                    module: this.cellShaderModule,
                    entryPoint: "fragmentMain",
                    buffers: [this.vertexBufferLayout],
                    targets: [{
                        format: this.presentationFormat
                    }]
                },
                primitive: {
                    topology: "triangle-strip", //"triangle-list",
                    cullMode: "back"
                }
            },
        );
        console.log("Created Pipeline")
    }

    RenderAll() {
        this.encoder = this.device.createCommandEncoder();

        this.commandPass = this.encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: {r: 1, g: 1, b: 0.4, a: 1},
                storeOp: "store",
            }]
        });
        this.commandPass.setPipeline(this.pipeline);

        for (let shape in this.shapes){
            shape.Render(this.commandPass);
        }
        this.commandPass.end();
        this.commandBuffer = this.encoder.finish();
        this.device.queue.submit([this.commandBuffer]);
    }
}