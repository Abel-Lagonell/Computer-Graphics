import {Uniform} from "./Scene Inheritance/Constants.js";
import {PointLight} from "./Scene Inheritance/Light/PointLight.js";
import {DirectionalLight} from "./Scene Inheritance/Light/DirectionalLight.js";

function FrameUpdate() {
    WebGPU.Instance.UpdateAll();
    WebGPU.Instance.RenderAll();
    requestAnimationFrame(FrameUpdate);
}

export class WebGPU {
    /**
     * @type WebGPU
     */
    static Instance;

    /**
     * @type {Transform[]}
     */
    shapes = [];
    currentPointLight = 0;
    currentSpotLight = 0;
    currentMaterial = 0;
    currentTexture = 0;

    /** @type {GPUTexture[]} */
    textures = [];
    /** @type {GPUSampler} */
    sampler = null;

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
        this.deltaTime = 0;
        this.timeSinceLastFrame = performance.now();
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
        });

        console.log("Created Simple Shader!");

        this.vertexBufferLayout = {
            arrayStride: 4 * 9, // 3-Position, 3-Normal, 1-MatIndex, 2-TexCoord
            attributes: [
                {
                    format: "float32x3",
                    offset: 0,
                    shaderLocation: 0, // position
                },
                {
                    format: "float32x3",
                    offset: 3 * 4,
                    shaderLocation: 1, // normal
                },
                {
                    format: "float32",
                    offset: 6 * 4,
                    shaderLocation: 2, // material index
                },
                {
                    format: "float32x2",
                    offset: 7 * 4,
                    shaderLocation: 3, // texture coordinates
                }
            ]
        };

        this.lightBuffer = this.device.createBuffer({
            label: "Light Buffer",
            size: Uniform.LightBuffer,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.DUMMYUniformBuffer = this.device.createBuffer({
            size: Uniform.MatrixBuffer,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.materialBuffer = this.device.createBuffer({
            label: "Material Buffer",
            size: Uniform.MaterialBuffer,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Create texture sampler
        this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        });

        // Initialize placeholder textures array (will be populated as textures load)
        this.textures = new Array(20).fill(null);

        // Create a default 1x1 white texture for materials without textures
        this.createDefaultTexture();

        this.pipeline = this.device.createRenderPipeline({
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
        });
        console.log("Created Pipeline");

        this.isReady = true;
    }

    createDefaultTexture() {
        // Create a 1x1 white texture as default
        const defaultTexture = this.device.createTexture({
            label: 'Default White Texture',
            size: [1, 1, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });

        // Write white pixel data
        const whitePixel = new Uint8Array([255, 255, 255, 255]);
        this.device.queue.writeTexture(
            { texture: defaultTexture },
            whitePixel,
            { bytesPerRow: 4 },
            { width: 1, height: 1 }
        );

        // Fill all slots with default texture initially
        for (let i = 0; i < 20; i++) {
            this.textures[i] = defaultTexture;
        }
    }

    RenderAll() {
        if (!this.isReady || !this.device) return;

        this.handleCanvasResize();
        this.encoder = this.device.createCommandEncoder();
        this.commandPass = this.encoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: {r: 0.1, g: 0.1, b: 0.1, a: 1},
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
        this.deltaTime = (performance.now() - this.timeSinceLastFrame) / 1000;
        this.timeSinceLastFrame = performance.now();
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