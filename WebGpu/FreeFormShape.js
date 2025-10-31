export class FreeFormShape {
    static colorInsertionType = -1;

    /**
     *
     * @param positions : number[][]
     * @param color : number[][]
     * @param normals : number[][]
     * @param specExp : number[]
     * @param spec : number[][]
     * @returns {Float32Array}
     */
    static GetArray(positions, color, normals = [], specExp = [], spec = []) {
        this.positions = positions
        this.color = color

        if (this.positions[0].length === 2) {
            this.is2D = true;
        }


        if (normals.length !== positions.length) {
            var temp = new Array(positions.length);
            normals = temp.fill(normals[0])
        }
        if (specExp.length !== positions.length) {
            specExp = new Array(positions.length);
            specExp = specExp.fill(1);
        }

        if (Math.floor(spec.length / positions.length) === 3) {
            specExp = color;
        }


        if (this.positions.length === this.color.length) {
            this.colorInsertionType = 1
        } else if (this.color.length === 1) {
            this.colorInsertionType = 2;
        } else if (this.positions.length / this.color.length === 3) {
            this.colorInsertionType = 0
        }
        if (this.colorInsertionType === -1) {
            throw new Error(`Color needs to per vertex or solid or triangle\n${this.color.length}`)
        }

        // Combined array to store the result
        let combinedArray = [];
        let j = 0;

        // Iterate through the coordinate points array
        for (let i = 0; i < this.positions.length; i++) {
            // Push coordinate point
            combinedArray = combinedArray.concat(this.positions[i]);
            if (this.is2D) combinedArray.push(0);

            //Push Color
            if (this.colorInsertionType === 2)
                combinedArray = combinedArray.concat(this.color[0]);
            else if (this.colorInsertionType === 1)
                combinedArray = combinedArray.concat(this.color[i]);
            else if (this.colorInsertionType === 0) {
                j = Math.floor(i / 3) % this.color.length;
                combinedArray = combinedArray.concat(this.color[j]);
            }

            //Push Normal
            combinedArray = combinedArray.concat(normals[i]);
            combinedArray = combinedArray.concat(specExp[i]);
            j = Math.floor(i / 3) % spec.length;
            combinedArray = combinedArray.concat(spec[j]);
        }
        return new Float32Array(combinedArray);
    }

    static GetSimpleArray(positions, normals = [], materialIndex = [], textureCoords = []) {
        if (normals.length !== positions.length) {
            var temp = new Array(positions.length);
            normals = temp.fill(normals[0])
        }

        var combinedArray = [];

        for (let i = 0; i < positions.length; i++) {
            combinedArray = combinedArray.concat(positions[i]);
            combinedArray = combinedArray.concat(normals[i]);
            // console.log(Math.floor(i/3)%materialIndex.length);
            combinedArray = combinedArray.concat(materialIndex[Math.floor(i/3)%materialIndex.length]);
            // combinedArray = combinedArray.concat(materialIndex[0])
            combinedArray = combinedArray.concat(textureCoords[i]);
        }

        // console.log(combinedArray);

        return new Float32Array(combinedArray);
    }
}