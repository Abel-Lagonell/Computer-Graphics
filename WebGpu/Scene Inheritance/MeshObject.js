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
 * @property {number[][]} [normals=[Vector3.Up.array]]
 * @property {number[]} [specExps=[1]]
 */

export class MeshObject extends Transform {
    /**
     * @param {MeshObjectOptions} [options={}] - Optional Mesh Object parameters
     */
    constructor(options = {}) {
        const {
            name = "MeshObject",
            vertices = [Vector3.Zero.array],
            normals = [Vector3.Up.array],
            materialIndex = [0],
            textureCoords = [[0.0, 0.0]],
            finalVertices = []
        } = options;
        
        super(name, {...options});
        
        if (finalVertices instanceof Float32Array)
            this.vertices = finalVertices
        else {
            if (finalVertices.length === 0)
                this.vertices = FreeFormShape.GetSimpleArray(vertices, normals, materialIndex, textureCoords)
            else
                this.vertices = new Float32Array(finalVertices)
        }
    }
}