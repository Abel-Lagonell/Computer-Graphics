import {Transform} from "./Transform.js";
import {FreeFormShape} from "../FreeFormShape.js";
import {Vector3} from "./Vector3.js";
import {Color} from "./Color.js";
//@ts-check
/** @type {import('mathjs')}*/

/**
 * @typedef {Object} MeshObjectOptions
 * @property {string} [name="MeshObject"]
 * @property {Vector3} [position=Vector3.Zero]
 * @property {Vector3} [rotation=Vector3.Zero]
 * @property {Vector3} [scale=Vector3.One]
 * @property {number[][]} [vertices=[Vector3.Zero.array]]
 * @property {number[][]} [color=[Color.Black]]
 */

export class MeshObject extends Transform {
    /**
     * @param {MeshObjectOptions} [options={}] - Optional Mesh Object parameters
     */
    constructor(options = {}) {
        const {
            name = "MeshObject",
            position = Vector3.Zero,
            rotation = Vector3.Zero,
            scale = Vector3.One,
            vertices = [Vector3.Zero.array],
            color = [Color.Black],
            normal = [Vector3.Up.array]
        } = options;
        
        super(name, {position: position, rotation: rotation, scale: scale});

        console.log(normal)
        this.vertices = FreeFormShape.GetArray(vertices, color, normal);
    }
}