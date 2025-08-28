class FreeFormShape {
    /**
     *
     * @param positions : number[]
     * @param color : number[]
     */
    constructor(positions, color) {
        this.positions = positions
        this.color = color
    }

    /**
     *
     * @returns {Float32Array}
     */
    GetArray() {
        // Combined array to store the result
        let combinedArray = [];

        // Iterate through the coordinate points array
        for (let i = 0; i < this.positions.length; i += 3) {
            // Push coordinate point
            combinedArray.push(this.positions[i]);
            combinedArray.push(this.positions[i + 1]);
            combinedArray.push(this.positions[i + 2]);

            // Push RGB values (repeated for each coordinate point)
            for (let j = 0; j < 3; j++) {
                combinedArray.push(this.color[j]);
            }
        }

        return new Float32Array(combinedArray);
    }
}
