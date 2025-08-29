class Main {
    constructor() {
        const first_trap = [
            [-1, -1],
            [1, -1],
            [-0.5, 1],
            [0.5, 1],
        ];
        let A_Back = new BasicPolygon(this.scale(first_trap, 2, 1), [Color.Red, Color.Red, Color.Yellow, Color.Yellow], "A_Back");
        WebGPU.Instance.AddShape(A_Back);

        const second_trap = [
            [-0.5, -1],
            [0.5, -1],
            [-0.35, -0.25],
            [0.35, -0.25],
        ];
        let A_Back2 = new BasicPolygon(this.scale(second_trap, 2, 1), [Color.White], "A_Back");
        WebGPU.Instance.AddShape(A_Back2);

        const A_hole = [
            [-0.3, 0.1],
            [0.3, 0.1],
            [-0.2, 0.6],
            [0.2, 0.6],
        ]
        let A_Hole = new BasicPolygon(this.scale(A_hole, 2, 1), [Color.White], "A_Hole");
        WebGPU.Instance.AddShape(A_Hole);

        //J
        const j = [
            [1, 1],
            [.2, 1],
            [1, -1],
            [0.2, -0.5],
            [-1, -1],
            [-1, 0.2],
            [-0.2, 0.2],
            [-0.2, -0.3],
        ]
        let J = new BasicPolygon(this.scale(j, 2, -1), [Color.Blue], "J");
        WebGPU.Instance.AddShape(J);
    }

    /**
     *
     * @param arr : number[][]
     * @param scale : number
     * @param position : number
     * @returns {number[][]}
     */
    scale(arr, scale, position = 1) {
        let array_2d = Array(arr.length);

        for (let i = 0; i < arr.length; i++) {
            const row = arr[i];
            let newRow = Array(row.length);

            for (let j = 0; j < row.length; j++) {
                newRow[j] = j % 2
                    ? row[j]
                    : row[j] / scale - (position / scale);
            }

            array_2d[i] = newRow;
        }

        return array_2d;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Running Main")
    let web = new WebGPU();
    let m = new Main();
})