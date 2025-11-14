import {MeshObject} from "../../Scene Inheritance/MeshObject.js";
import {WebGPU} from "../../WebGPU.js";
import {Vector3} from "../../Scene Inheritance/Vector3.js";
import {Camera} from "../../Scene Inheritance/Camera.js";
import {SixAxisController} from "../../Scene Inheritance/SixAxisController.js";

const Type = Object.freeze({
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT2": 4,
    "MAT3": 9,
    "MAT4": 16,
})

const ComponentType = Object.freeze({
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
})

class Main {
    /** @type */
    arrayBuffer;

    constructor() {
        this.SlowStart()
    }

    async SlowStart() {
        const text_gltf = await this.LoadFile("../GLTF/TextureSample.gltf");
        /** @type {GLTF} */
        this.gltf = JSON.parse(text_gltf);
        console.log(this.gltf);
        await this.LoadBin("../GLTF/TextureSample.bin");
        while (!this.arrayBuffer) {
            await this.Sleep(200);
        }

        const parsed = await this.ParseGLTF(this.gltf);


        this.web = new WebGPU;
        let camera = new Camera();
        let six = new SixAxisController({
            linearSpeed: 5,
            position: new Vector3(0, +2, -5),
        });


        let mesh = new MeshObject({
            vertices: parsed[0],
            normals: parsed[1],
            textureCoords: parsed[2],
            materialIndex: [0],
        })

        six.AddChild(camera)

        this.web.AddShape([mesh, six])

        console.log(mesh.vertices);

    }

    /**
     * @param gltf : GLTF
     * @constructor
     */
    async ParseGLTF(gltf) {
        /** @type GLTFScene */
        var defaultScene = gltf.scenes[gltf.scene]

        let arrays = []

        for (let node in defaultScene.nodes) {
            for (let mesh in node) {
                for (let primitive of gltf.meshes[mesh].primitives) {
                    for (const key in primitive.attributes){
                        arrays.push(await this.AccessorGetter(gltf.accessors[primitive.attributes[key]]));
                    } 
                } 
            }
        }

        return arrays;
    }

    Sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async LoadFile(url) {
        const response = await fetch(url);
        return await response.text();
    }

    async LoadBin(url) {
        const req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";

        req.onload = (e) => {
            const arrayBuffer = req.response;
            if (arrayBuffer) {
                this.arrayBuffer = arrayBuffer;
                return this.arrayBuffer;
            }
        }
        req.send(null);
    }

    /** @param accessor : GLTFAccessor */
    async AccessorGetter(accessor){
        var bufferType = Type[accessor.type]
        var bufferComponentType = ComponentType[accessor.componentType]
        var array = new bufferComponentType(this.arrayBuffer)
        var componentLength = array.byteLength/array.length;
        var bufferView = this.gltf.bufferViews[accessor.bufferView];
        var bufferLength = bufferView.byteLength/componentLength;
        var bufferOffset = bufferView.byteOffset/componentLength;

        let result = [];
        let temp = [];
        for (let i = bufferOffset; i < bufferOffset + bufferLength; i++) {
            temp[i % bufferType] = array[i];
            if (temp.length === bufferType) {
                result.push(temp);
                temp = []
            }
        }
        return result
    }

    
    async ArrayGetter(buffer, bufferLength, bufferOffset, type, componentType) {
        console.log(bufferLength, bufferOffset);
        bufferLength = bufferLength / 4;
        bufferOffset = bufferOffset / 4;
        var newBuffer = new Float32Array(buffer);
        let vectorArray = [];
        let temp = [];
        for (let i = bufferOffset; i < bufferOffset + bufferLength; i++) {
            temp[i % Type[type]] = newBuffer[i];
            if (temp.length === Type[type]) {
                vectorArray.push(temp);
                temp = []
            }
        }
        return vectorArray;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main");
    let m = new Main();
})
