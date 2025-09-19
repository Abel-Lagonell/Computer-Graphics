export class Material {
    specularExponent = 0; //Ns
    ambient = []; //Ka
    diffuse = []; //Kd
    specularColor = []; //Ks
    emission = [] //Ke
    refraction = 0; //Ni
    transparency = 0; //d
    illuminationMode = 0; //illum
}

export class OBJ {
    /**
     * @type {{string: number[][]}}
     */
    materialFaceElements = {};

    /**
     *
     * @type {{string: Material}}
     */
    materialReference = {}

    trianglesPerFace = []

    /**
     * @param name : string
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * @param vertices : number[][]
     * @param textureCoordinates : number[][]
     * @param vertexNormals : number[][]
     * @param smoothShading : number
     */
    Initialize(vertices, textureCoordinates, vertexNormals, smoothShading) {
        this.vertices = [...vertices];
        this.textureCoordinates = [...textureCoordinates];
        this.vertexNormals = [...vertexNormals];
        this.smoothShading = smoothShading;
    }

    /**
     * Returns a flat array of triangle vertices suitable for WebGPU
     * Each triangle is 3 consecutive vertices (9 numbers total: x1,y1,z1,x2,y2,z2,x3,y3,z3)
     * @returns {number[]} Flat array of vertex coordinates
     */
    GetTriangleList() {
        let triangleVertices = [];

        for (let materialName in this.materialFaceElements) {
            let faces = this.materialFaceElements[materialName];

            for (let face of faces) {
                // Convert face to triangles (triangulate if needed)
                // OBJ faces can be triangles (3 vertices) or quads (4 vertices) or polygons
                for (let i = 1; i < face.length - 1; i++) {
                    // Create triangle: vertex 0, vertex i, vertex i+1
                    let triangle = [face[0], face[i], face[i + 1]];

                    for (let vertexIndex of triangle) {
                        let vertex = this.vertices[vertexIndex[0]]; // vertexIndex[0] is the vertex position index
                        triangleVertices.push(vertex); // Push x, y, z
                    }
                }
            }
        }

        return triangleVertices;
    }

    GetColorList() {
        let colorList = [];
        for (let materialName in this.materialFaceElements) {
            let faces = this.materialFaceElements[materialName];
            for (let i in faces) {
                for (let _ = 0; _ < this.trianglesPerFace[i]; _++){
                    colorList.push(this.materialReference[materialName].diffuse)
                }
            }
        }
        return colorList;
    }
}

export class OBJParser {
    /**
     *
     * @type {{string: Material}}
     */
    materials = {};

    OBJs = []
    verticesArray = [];
    textureCoordinates = [];
    vertexNormals = [];
    smoothShading = 0;

    runningTotal = [0, 0, 0]
    currentIndex = -1;
    currentMaterial = "";
    textFile = "";

    async parseObj(objectUrl) {
        this.textFile = await this.loadFile(objectUrl + ".obj");
        return this.parseObjFile(this.textFile);
    }

    async loadFile(url) {
        const response = await fetch(url);
        return await response.text();
    }

    async parseObjFile(textFile) {
        /** @type {string[]} */
        let lines = textFile.split("\n");
        for (let line of lines) {
            if (line[0] === "" || line[0] === "#") {
                continue;
            }
            let [header, ...content] = line.split(" ")
            switch (header) {
                case "mtllib":
                    await this.parseMtl("./" + content[0])
                    break;
                case "v":
                    let vertex = [Number(content[0]), Number(content[1]), Number(content[2])];
                    this.verticesArray.push(vertex)
                    break;
                case "vt":
                    let texCoord = [Number(content[0]), Number(content[1])];
                    this.textureCoordinates.push(texCoord);
                    break;
                case "vn":
                    let vertexNormal = [Number(content[0]), Number(content[1]), Number(content[2])];
                    this.vertexNormals.push(vertexNormal);
                    break;
                case "s":
                    this.smoothShading = Number(content[0]);
                    break;
                case "o":
                    this.OBJs.push(new OBJ(content[0]));
                    this.currentIndex++;
                    this.runningTotal = [this.verticesArray.length, this.textureCoordinates.length, this.vertexNormals.length];
                    this.vertexNormals = [];
                    this.verticesArray = [];
                    this.textureCoordinates = []
                    break;
                case "f":
                    this.OBJs[this.currentIndex].Initialize(this.verticesArray, this.textureCoordinates, this.vertexNormals, this.smoothShading);
                    let faceElement = [];
                    for (let faceVertex of content) {
                        let numbers = faceVertex.split("/");
                        faceElement.push([
                            +numbers[0] - (1 + this.runningTotal[0]),
                            +numbers[1] - (1 + this.runningTotal[1]),
                            +numbers[2] - (1 + this.runningTotal[2])
                        ]);
                    }
                    this.OBJs[this.currentIndex].materialFaceElements[this.currentMaterial].push(faceElement);
                    this.OBJs[this.currentIndex].trianglesPerFace.push(content.length % 3 + 1);
                    break;
                case "usemtl":
                    this.OBJs[this.currentIndex].materialFaceElements[content[0]] = [];
                    this.OBJs[this.currentIndex].materialReference[content[0]] = this.materials[content[0]];
                    this.currentMaterial = content[0]
                    break;
            }
        }

        return this.OBJs;
    }


    async parseMtl(materialUrl) {
        this.textFile = await this.loadFile(materialUrl);
        this.parseMtlFile(this.textFile);
    }

    parseMtlFile(textFile) {
        /** @type {string[]} */
        let lines = textFile.split("\n");
        for (let line of lines) {
            if (line[0] === "" || line[0] === "#") {
                continue;
            }
            let [header, ...content] = line.split(" ");
            switch (header) {
                case "newmtl":
                    this.materials[content[0]] = new Material();
                    this.currentMaterial = content[0];
                    break;
                case "Ns":
                    this.materials[this.currentMaterial].specularExponent = +content[0];
                    break;
                case "Ka":
                    this.materials[this.currentMaterial].ambient = [+content[0], +content[1], +content[2]];
                    break;
                case "Kd":
                    this.materials[this.currentMaterial].diffuse = [+content[0], +content[1], +content[2]];
                    break;
                case "Ks":
                    this.materials[this.currentMaterial].specularColor = [+content[0], +content[1], +content[2]];
                    break;
                case "Ke":
                    this.materials[this.currentMaterial].emission = [+content[0], +content[1], +content[2]];
                    break;
                case "Ni":
                    this.materials[this.currentMaterial].refraction = +content[0];
                    break;
                case "d":
                    this.materials[this.currentMaterial].transparency = +content[0];
                    break;
                case "illum":
                    this.materials[this.currentMaterial].illuminationMode = +content[0];
                    break;
            }
        }
    }
}