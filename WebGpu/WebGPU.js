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

    /** @type {GPUTexture} */
    textureArray = null;
    /** @type {GPUTexture} */
    normalTextureArray = null;
    /** @type {GPUSampler} */
    sampler = null;

    // Track which layers have been written to
    textureLayersUsed = new Array(20).fill(false);
    maxTextureSize = 640; // Maximum texture dimension

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
        this.context.configure({
            device: this.device,
            format: this.presentationFormat
        });
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

        // Updated vertex buffer layout to include texture coordinates
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

        // Create 2D texture array with 20 layers
        this.CreateTextureArray();
        this.CreateNormalTextureArray();

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

    CreateTextureArray() {
        // Create a 2D texture array with 20 layers
        this.textureArray = this.device.createTexture({
            label: 'Texture Array',
            size: [this.maxTextureSize, this.maxTextureSize, 20], // width, height, array layers
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
            dimension: '2d',
        });

        // Initialize all layers with white pixels
        const whitePixel = new Uint8Array(4 * this.maxTextureSize * this.maxTextureSize);
        for (let i = 0; i < whitePixel.length; i += 4) {
            whitePixel[i] = 255;     // R
            whitePixel[i + 1] = 255; // G
            whitePixel[i + 2] = 255; // B
            whitePixel[i + 3] = 255; // A
        }

        // Write white to all layers initially
        for (let layer = 0; layer < 20; layer++) {
            this.device.queue.writeTexture(
                {
                    texture: this.textureArray,
                    origin: { x: 0, y: 0, z: layer }
                },
                whitePixel,
                {
                    bytesPerRow: this.maxTextureSize * 4,
                    rowsPerImage: this.maxTextureSize
                },
                {
                    width: this.maxTextureSize,
                    height: this.maxTextureSize,
                    depthOrArrayLayers: 1
                }
            );
        }

        console.log(`Created texture array with 20 layers (${this.maxTextureSize}x${this.maxTextureSize})`);
    }

    CreateNormalTextureArray() {
        this.normalTextureArray = this.device.createTexture({
            label: "Normal Texture Array",
            size: [this.maxTextureSize, this.maxTextureSize, 20],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
            dimension: '2d',
        })

        // Initialize all layers with white pixels
        const whitePixel = new Uint8Array(4 * this.maxTextureSize * this.maxTextureSize);
        for (let i = 0; i < whitePixel.length; i += 4) {
            whitePixel[i] = 0;     // R
            whitePixel[i + 1] = 0; // G
            whitePixel[i + 2] = 255; // B
            whitePixel[i + 3] = 255; // A
        }

        // Write white to all layers initially
        for (let layer = 0; layer < 20; layer++) {
            this.device.queue.writeTexture(
                {
                    texture: this.normalTextureArray,
                    origin: { x: 0, y: 0, z: layer }
                },
                whitePixel,
                {
                    bytesPerRow: this.maxTextureSize * 4,
                    rowsPerImage: this.maxTextureSize
                },
                {
                    width: this.maxTextureSize,
                    height: this.maxTextureSize,
                    depthOrArrayLayers: 1
                }
            );
        }

        console.log(`Created texture array with 20 layers (${this.maxTextureSize}x${this.maxTextureSize})`);
    }

    /**
     * Write an image to a specific layer of the texture array
     * @param {HTMLImageElement} image
     * @param {HTMLImageElement} normalImage
     * @param {number} layerIndex
     */
    WriteImageToTextureLayer(image, normalImage, layerIndex) {
        if (layerIndex < 0 || layerIndex >= 20) {
            console.error(`Invalid texture layer index: ${layerIndex}`);
            return;
        }

        // Create a canvas to get image data and resize if needed
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Determine the size to use (scale down if too large)
        const size = Math.min(this.maxTextureSize, Math.max(image.width, image.height));
        canvas.width = size;
        canvas.height = size;

        // Draw image scaled to fit
        ctx.drawImage(image, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);

        // Write to the specific layer
        this.device.queue.writeTexture(
            {
                texture: this.textureArray,
                origin: { x: 0, y: 0, z: layerIndex }
            },
            imageData.data,
            {
                bytesPerRow: size * 4,
                rowsPerImage: size
            },
            {
                width: size,
                height: size,
                depthOrArrayLayers: 1
            }
        );

        ctx.drawImage(normalImage, 0, 0, size, size);
        const normalImageData = ctx.getImageData(0, 0, size, size);

        // Write to the specific layer
        this.device.queue.writeTexture(
            {
                texture: this.normalTextureArray,
                origin: { x: 0, y: 0, z: layerIndex }
            },
            normalImageData.data,
            {
                bytesPerRow: size * 4,
                rowsPerImage: size
            },
            {
                width: size,
                height: size,
                depthOrArrayLayers: 1
            }
        );

        this.textureLayersUsed[layerIndex] = true;
        console.log(`Wrote texture to layer ${layerIndex} (${size}x${size})`);
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