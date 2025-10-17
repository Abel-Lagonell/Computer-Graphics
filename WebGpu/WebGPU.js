import {Uniform} from "./Scene Inheritance/Constants.js";
import {PointLight} from "./Scene Inheritance/Light/PointLight.js";

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
        })

        console.log("Created Simple Shader!")

        this.vertexBufferLayout = {
            arrayStride: 4 * 14, // 3-Position, 4-Color, 3-Normal, 1-SpecularExp, 3 Spec
            attributes: [
                {
                    format: "float32x3",
                    offset: 0,
                    shaderLocation: 0,
                },
                {
                    format: "float32x4",
                    offset: 3 * 4,
                    shaderLocation: 1,
                },
                {
                    format: "float32x3",
                    offset: 7 * 4,
                    shaderLocation: 2,
                },
                {
                    format: "float32",
                    offset: 10 * 4,
                    shaderLocation: 3,
                },
                {
                    format: "float32x3",
                    offset: 10 * 4 + 4,
                    shaderLocation: 4,
                },
            ]
        }

        this.lightBuffer = this.device.createBuffer({
            label: "Light Buffer",
            size: Uniform.LightBuffer,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.DUMMYUniformBuffer = this.device.createBuffer({
            size: Uniform.MatrixBuffer,
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

        const shadowMapSize = 2048;
        
        // Shadow map texture (1024x1024 is typical)
        this.shadowMapTexture = this.device.createTexture({
            size: [shadowMapSize, shadowMapSize],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        // Shadow map sampler (comparison sampler for PCF)
        this.shadowSampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            compare: 'less', // This enables depth comparison
        });

        // Load shadow shader
        this.shadowShaderCode = await this.loadWGSLShader("../Scene Inheritance/ShadowShader.wgsl");

        this.shadowShaderModule = this.device.createShaderModule({
            label: "Shadow Shader",
            code: this.shadowShaderCode
        });

        // Shadow pipeline (only needs position, no colors/normals)
        this.shadowPipeline = this.device.createRenderPipeline({
            label: "Shadow Pipeline",
            layout: "auto",
            vertex: {
                module: this.shadowShaderModule,
                entryPoint: "vertexMain",
                buffers: [this.vertexBufferLayout] // Same vertex format
            },
            // No fragment shader output (depth only)
            primitive: {
                topology: "triangle-list",
                cullMode: "back" // Can also try "front" to reduce peter-panning
            },
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: true,
                depthCompare: 'less',
            }
        });

        this.isReady = true;

    }

    RenderShadowMap() {
        if (!this.isReady || !this.device) return;

        // Calculate light space matrix
        const lightSpaceMatrix = PointLight.getDirectionalLightMatrix();
        this.currentLightSpaceMatrix = lightSpaceMatrix; // Store for main pass

        // Create buffer for light space matrix
        if (!this.shadowUniformBuffer) {
            this.shadowUniformBuffer = this.device.createBuffer({
                size: 64, // 4x4 matrix = 16 floats = 64 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
        }

        // Write light space matrix to buffer
        const matrixData = new Float32Array(math.flatten(lightSpaceMatrix).toArray());
        this.device.queue.writeBuffer(this.shadowUniformBuffer, 0, matrixData);

        // Create bind group for shadow pass
        if (!this.shadowBindGroup) {
            this.shadowBindGroup = this.device.createBindGroup({
                layout: this.shadowPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.shadowUniformBuffer } }
                ]
            });
        } else {
            // Update bind group (recreate with updated buffer)
            this.shadowBindGroup = this.device.createBindGroup({
                layout: this.shadowPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.shadowUniformBuffer } }
                ]
            });
        }

        // Begin shadow render pass
        const shadowEncoder = this.device.createCommandEncoder();
        const shadowPass = shadowEncoder.beginRenderPass({
            label: "Shadow Map Pass",
            colorAttachments: [], // No color output!
            depthStencilAttachment: {
                view: this.shadowMapTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        });

        shadowPass.setPipeline(this.shadowPipeline);
        shadowPass.setBindGroup(0, this.shadowBindGroup);

        // Render all shapes from light's perspective
        for (let shape of this.shapes) {
            if (shape.vertexBuffer && shape.vertices.length > 14) {
                shadowPass.setVertexBuffer(0, shape.vertexBuffer);
                shadowPass.draw(shape.vertices.length / 14);
            }
        }

        shadowPass.end();

        // Submit shadow pass
        const shadowCommandBuffer = shadowEncoder.finish();
        this.device.queue.submit([shadowCommandBuffer]);
    }
    
    RenderAll() {
        if (!this.isReady || !this.device) return;

        this.handleCanvasResize();
        
        this.RenderShadowMap()

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