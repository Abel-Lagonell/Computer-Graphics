export class Color {
    static Red = [1,0,0,1];
    static Green = [0,1,0,1];
    static Blue = [0,0,1,1];
    static Yellow = [1,1,0,1];
    static Cyan = [0,1,1,1];
    static Purple = [1,0,1,1];
    static White = [1,1,1,1];
    static Black = [0,0,0,1];

    /**
     * 
     * @param rgb : number[]
     * @returns {number[]}
     */
    static RGB(rgb){
        for (let val of rgb )
            if (val > 255)
                throw new Error("RGB Values are over 255")
        if (rgb.length > 3 || rgb.length === 0)
            throw new Error("Wrong Length of RGB values")
        return [rgb[0]/255, rgb[1]/255, rgb[2]/255]
    }
    
    static HSV(hsv){
        let r, g, b;

        const c = v * s; // chroma
        const hh = (h % 360) / 60; // sector [0,6)
        const x = c * (1 - Math.abs(hh % 2 - 1));
        let [rp, gp, bp] = [0, 0, 0];

        if (0 <= hh && hh < 1) [rp, gp, bp] = [c, x, 0];
        else if (1 <= hh && hh < 2) [rp, gp, bp] = [x, c, 0];
        else if (2 <= hh && hh < 3) [rp, gp, bp] = [0, c, x];
        else if (3 <= hh && hh < 4) [rp, gp, bp] = [0, x, c];
        else if (4 <= hh && hh < 5) [rp, gp, bp] = [x, 0, c];
        else if (5 <= hh && hh < 6) [rp, gp, bp] = [c, 0, x];

        const m = v - c;
        r = rp + m;
        g = gp + m;
        b = bp + m;

        return [r, g, b];
    }
}