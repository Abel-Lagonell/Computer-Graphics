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

    /**
     * @type {Transform[]}
     */
    shapes = [];
    currentPointLight = 0;

    constructor() {
        if (WebGPU.Instance === undefined) {
            WebGPU.Instance = this;
        }
        this.isReady = false;
        this.initializationPromise = this.initialize();

        /**
         * @type {Transform[]}
         */
        this.shapes = [];
    }

    async initialize() {
        try {
            this.shaderCode = await this.loadWGSLShader("../Scene Inheritance/MatrixShader.wgsl");
            await this.SetUpGPU();
            this.isReady = true;
            console.log("WebGPU fully initialized");

            // Now initialize any queued shapes
            await this.SlowStart();
        } catch (error) {
            console.error("Failed to initialize WebGPU:", error);
            throw error;
        }
    }

    async WaitForReady() {
        if (!this.isReady)
            await this.initializationPromise;
        return this.isReady;
    }

    async loadWGSLShader(url) {
        const response = await fetch(url);
        return await response.text();
    }

    /**
     * @param shapes : Transform[]
     */
    async AddShape(shapes) {
        await this.WaitForReady();
        for (let shape of shapes) {
            this.shapes.push(shape);
            await shape.WriteToGPU();
        }
    }

    async SlowStart() {
        // Only start if we have shapes and are ready
        if (this.shapes.length === 0) {
            requestAnimationFrame(FrameUpdate);
            return;
        }

        for (let i = 0; i < this.shapes.length; i++) {
            await this.shapes[i].WriteToGPU();
        }
        this.RenderAll();
        requestAnimationFrame(FrameUpdate);
    }

    UpdateAll() {
        if (!this.isReady) return;
        for (let shape of this.shapes) {
            shape._Update();
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

        this.depthTexture = this.device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.cellShaderModule = this.device.createShaderModule({
            label: "Simple Shader",
            code: this.shaderCode
        })

        console.log("Created Simple Shader!")

        this.vertexBufferLayout = {
            arrayStride: 4 * 3 + 4 + 4, // 3-Position, 1-Color, 1-Normal
            attributes: [
                {
                    format: "float32x3",
                    offset: 0,
                    shaderLocation: 0,
                },
                {
                    format: "unorm8x4",
                    offset: 3 * 4,
                    shaderLocation: 1,
                },
                {
                    format: "snorm8x4",
                    offset: 3 * 4 + 4,
                    shaderLocation: 2,
                }
            ]
        }

        this.lightBuffer = this.device.createBuffer({
            size: 336,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.DUMMYUniformBuffer = this.device.createBuffer({
            size: 4 * 4 * 4 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })


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
                        format: this.presentationFormat,
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add'
                            }
                        }
                    }]
                },
                primitive: {
                    topology: "triangle-list",
                    cullMode: "back"
                },
                depthStencil: {
                    format: 'depth24plus',
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                }
            },
        );
        console.log("Created Pipeline")

        this.isReady = true;

    }

    RenderAll() {
        if (!this.isReady || !this.device) return;

        this.handleCanvasResize();
        this.encoder = this.device.createCommandEncoder();

        this.commandPass = this.encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: {r: 1, g: 1, b: 1, a: 1},
                storeOp: "store",
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        });
        this.commandPass.setPipeline(this.pipeline);

        for (let i = 0; i < this.shapes.length; i++) {
            this.shapes[i].Render(this.commandPass);
        }

        this.commandPass.end();
        this.commandBuffer = this.encoder.finish();
        this.device.queue.submit([this.commandBuffer]);
    }

    handleCanvasResize() {
        if (this.canvas.width !== this.canvas.clientWidth ||
            this.canvas.height !== this.canvas.clientHeight) {

            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;

            // Recreate depth texture with new size
            this.depthTexture.destroy();
            this.depthTexture = this.device.createTexture({
                size: [this.canvas.width, this.canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }
    }

}