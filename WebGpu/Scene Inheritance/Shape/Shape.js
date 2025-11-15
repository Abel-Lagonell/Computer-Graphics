import {Vector3} from "../Vector3.js";

export class Shape {
    constructor(options = {}) {
        const {
            position= Vector3.Zero.copy(),
            rotation= Vector3.Zero.copy(),
        } = options;
    }
}