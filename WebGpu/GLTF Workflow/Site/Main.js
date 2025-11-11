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
    5125: Int32Array,
    5126: Uint32Array,
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
        const text_bin = await this.LoadBin("../GLTF/TextureSample.bin");
        while (!this.arrayBuffer) {
            await this.Sleep(200);
        }
        document.getElementById("log").innerHTML = text_gltf;

        let vec = await this.ArrayGetter(this.arrayBuffer, this.gltf.bufferViews[1].byteLength, this.gltf.bufferViews[1].byteOffset, Type.VEC3, this.gltf.accessors[1].componentType)

        this.ParseGLTF(this.gltf)
    }

    /**
     * @param gltf : GLTF
     * @constructor
     */
    ParseGLTF(gltf) {
        /** @type GLTFScene */
        var defaultScene = gltf.scenes[gltf.scene]

        for (let node in defaultScene.nodes) {
            for (let mesh in node) {
                for (let primitive of gltf.meshes[mesh].primitives) {
                    for (const key in primitive.attributes){
                        console.log(gltf.accessors[primitive.attributes[key]]);
                    } 
                } 
            }
        }
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
