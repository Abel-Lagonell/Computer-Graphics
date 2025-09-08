export class FreeFormShape {
    /**
     *
     * @param positions : number[][]
     * @param color : number[][]
     */
    constructor(positions, color) {
        this.positions = positions
        this.color = color
        
        if (this.positions[0].length === 2){
            this.is2D = true;
        } 

        if (positions.length !== this.color.length && this.color.length !== 1) {
            throw new Error("Color needs to per vertex or solid")
        }
    }

    /**
     *
     * @returns {Float32Array}
     */
    GetArray() {
        // Combined array to store the result
        let combinedArray = [];

        // Iterate through the coordinate points array
        for (let i = 0; i < this.positions.length; i++) {
            // Push coordinate point
            combinedArray = combinedArray.concat(this.positions[i]);
            if (this.is2D) combinedArray.push(0);
            
            if (this.color.length === 1)
                combinedArray = combinedArray.concat(this.color[0]);
            else
                combinedArray = combinedArray.concat(this.color[i]);

        }

        return new Float32Array(combinedArray);
    }
}