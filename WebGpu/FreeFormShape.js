export class FreeFormShape {
    static colorInsertionType = -1;

    /**
     *
     * @param positions : number[][]
     * @param color : number[][]
     * @returns {Float32Array}
     */
    static GetArray(positions, color) {
        this.positions = positions
        this.color = color

        if (this.positions[0].length === 2) {
            this.is2D = true;
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

            if (this.colorInsertionType === 2)
                combinedArray = combinedArray.concat(this.color[0]);
            else if (this.colorInsertionType === 1)
                combinedArray = combinedArray.concat(this.color[i]);
            else if (this.colorInsertionType === 0) {
                j = Math.floor(i/3) % this.color.length;
                combinedArray = combinedArray.concat(this.color[j]);
                console.log(this.color[j]);
            }
            
        }

        return new Float32Array(combinedArray);
    }
}