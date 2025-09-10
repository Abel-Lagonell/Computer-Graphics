import {TransformObject} from "./TransformObject.js";
import {Vector3} from "./Vector3.js";

export class PlayerController extends TransformObject {
    constructor(name, vertices, color, position, rotation, scale) {
        super(name, vertices, color, position, rotation, scale);
    }

    Ready() {
    }

    Update() {
        this.UP_IS_PRESSED = (this.gpu.CheckKey("w") || this.gpu.CheckKey("W") || this.gpu.CheckKey("ArrowUp"));
        this.DOWN_IS_PRESSED = (this.gpu.CheckKey("s") || this.gpu.CheckKey("S") || this.gpu.CheckKey("ArrowDown"));
        this.LEFT_IS_PRESSED = (this.gpu.CheckKey("a") || this.gpu.CheckKey("A") || this.gpu.CheckKey("ArrowLeft"));
        this.RIGHT_IS_PRESSED = (this.gpu.CheckKey("d") || this.gpu.CheckKey("D") || this.gpu.CheckKey("ArrowRight"));

        this.Move()
    }

    Move() {
        if (this.UP_IS_PRESSED)
            this.position = this.position.add(Vector3.Up.scale(0.01));
        if (this.DOWN_IS_PRESSED)
            this.position = this.position.add(Vector3.Down.scale(0.01));
        if (this.RIGHT_IS_PRESSED)
            this.position = this.position.add(Vector3.Right.scale(0.01));
        if (this.LEFT_IS_PRESSED)
            this.position = this.position.add(Vector3.Left.scale(0.01));
    }


}