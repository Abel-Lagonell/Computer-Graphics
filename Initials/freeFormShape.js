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
     * @returns {number[]}
     */
    get_array() {
        // Combined array to store the result
        let combinedArray = [];

        // Iterate through the coordinate points array
        for (let i = 0; i < this.positions.length; i += 2) {
            // Push coordinate point
            combinedArray.push(this.positions[i]);
            combinedArray.push(this.positions[i + 1]);

            // Push RGB values (repeated for each coordinate point)
            for (let j = 0; j < 3; j++) {
                combinedArray.push(this.color[j]);
            }
        }

        return combinedArray;
    }
}

// Export the class for use in other files
export { FreeFormShape };