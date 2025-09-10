function FrameUpdate() {
    WebGPU.Instance.UpdateAll();
    WebGPU.Instance.RenderAll();
    requestAnimationFrame(FrameUpdate);

}

class WebGPU {
    /**
     * @type WebGPU
     */
    static Instance;
    keys =[];

    constructor() {
        if (WebGPU.Instance === undefined) {
            WebGPU.Instance = this;
        }
        this.isReady = false;
        this.loadWGSLShader("../Scene Inheritance/MatrixShader.wgsl").then(r => {
                this.shaderCode = r
                this.SetUpGPU().then(() =>
                    this.SlowStart())
            }
        )

        /**
         * @type {BasicPolygon [] | TransformObject[]}
         */
        this.shapes = [];
    }

    async loadWGSLShader(url) {
        const response = await fetch(url);
        return await response.text();
    }

    /**
     *
     * @param shape : TransformObject/BasicPolygon
     */
    AddShape(shape) {
        this.shapes.push(shape);
    }

    async SlowStart() {
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].WriteToGPU();
        }
        this.RenderAll();
        requestAnimationFrame(FrameUpdate);
    }

    UpdateAll() {
        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].Update()
        }

    }

    async SetUpGPU() {
        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error("No Appropriate GPUAdapter found");
        }
        this.device = await this.adapter.requestDevice();
        if (!this.device) {
            throw new Error("need a browser that supports WebGPU");
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
            code: this.shaderCode
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
                clearValue: {r: 1, g: 1, b: 1, a: 1},
                storeOp: "store",
            }]
        });
        this.commandPass.setPipeline(this.pipeline);

        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].Render(this.commandPass);
        }

        this.commandPass.end();
        this.commandBuffer = this.encoder.finish();
        this.device.queue.submit([this.commandBuffer]);
    }

    KeyDown(event){
        this.keys[String.fromCharCode(event.keyCode)] = true;
    }

    KeyUp(event){
        this.keys[String.fromCharCode(event.keyCode)] = false;
    }

    static KeyDownHelper(event){
        WebGPU.Instance.KeyDown(event)
    }

    static KeyUpHelper(event){
        WebGPU.Instance.KeyUp(event)
    }

    CheckKey(key){
        let keyExists = (key in this.keys);
        let keyIsPressed = (this.keys[key]);

        return (keyExists && keyIsPressed);
    }
    
}