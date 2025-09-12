import {Transform} from "./Transform.js";
import {FreeFormShape} from "../FreeFormShape.js";
import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
//@ts-check
export class MeshObject extends Transform {
    /**
     * @param {MeshObjectOptions} [options={}] - Optional Mesh Object parameters
     * @param {string} [options.name="MeshObject"]
     * @param {Vector3} [options.position=Vector3.Zero]
     * @param {Vector3} [options.rotation=Vector3.Zero]
     * @param {Vector3} [options.scale=Vector3.One]
     * @param {number[][]} [options.vertices=[Vector3.Zero.array]]
     * @param {number[][]} [options.color=[Color.Black]]
     */
    constructor(options = {}) {
        const {
            name = "MeshObject",
            position = Vector3.Zero,
            rotation = Vector3.Zero,
            scale = Vector3.One,
            vertices = [Vector3.Zero.array],
            color = [Color.Black]
        } = options;
        
        super(name, {position: position, rotation: rotation, scale: scale});

        this.vertices = FreeFormShape.GetArray(vertices, color);
    }
    
    /**
     * @param pass : GPURenderPassEncoder
     */
    Render(pass) {
        pass.setBindGroup(0, this.bindGroup)
        this.WriteToBuffer()
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / 6);
        this.CallInChildren("Render", [pass])
    }
}