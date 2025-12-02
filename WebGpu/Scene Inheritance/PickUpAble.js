import {Transform} from "./Transform.js";

export class PickUpAble extends Transform {
    constructor(weight = 1, value = 1) {
        super("Item");
        this.weight = weight;
        this.value = value;
    }
}