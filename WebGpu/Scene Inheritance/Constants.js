export class Uniform {
    /**
     * 
     * @type {number}
     */
    static LightBuffer = 352;

    static LightIndex = Object.freeze({
        numPoints: 0,
        ka: 4,
        ia: 16,
        pointLights: 32
    })

    /**
     * 4 Rows, 4 Columns, 4 bytes per, 3 matrices
     * @type {number}
     */
    static MatrixBuffer = 4*4*4*3;
}