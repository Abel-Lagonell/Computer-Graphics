export class Uniform {
    /**
     * 
     * @type {number}
     */
    static LightBuffer = 64 * 32*10 + 48*10;

    static LightIndex = Object.freeze({
        numPoints: 0,
        numSpots: 4,
        ambientColor: 16,
        directionalLight: 32,
        pointLights: 64,
        spotLights: 64+32*10,
    })

    static MaterialBuffer = 48*20;

    static Material = 48;

    static MaterialIndex = Object.freeze({
        ambientColor: 0,
        transparency: 12,
        diffuseColor: 16,
        refraction: 28,
        specularColor: 32,
        specularExponent: 44,
    })

    /**
     * 4 Rows, 4 Columns, 4 bytes per, 4 matrices
     * @type {number}
     */
    static MatrixBuffer = 4*4*4*4 + 16;
}