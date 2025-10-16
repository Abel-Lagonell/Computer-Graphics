import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";

export class Camera extends Transform {
    constructor(options = {}) {
        const {
            name = "Camera",
            position = new Vector3(0, 0, 0),
            rotation = Vector3.Zero.copy(),
            near = 0.001,
            far = 5000,
            right = 0.001,
            left = -0.001,
            top = 0.001,
            bottom = -0.001,
        } = options;


        super(name, {position: position, rotation: rotation, scale: Vector3.One});

        this.perspectiveMatrix = math.matrix([
            [(2 * near) / (right - left), 0, 0, 0],
            [0, 2 * near / (top - bottom), 0, 0],
            [(right + left) / (right - left), (top + bottom) / (top - bottom), (far + near) / (far - near), 1],
            [0, 0, 2 * far * near / (far - near), 1]
        ]);
        
        
    }
    
    get viewMatrix(){
        const upVector3 = new Vector3(this.globalTransformMatrix.get([1, 0]), this.globalTransformMatrix.get([1, 1]), this.globalTransformMatrix.get([1, 2]));
        const forwardVector3 = new Vector3(this.globalTransformMatrix.get([2, 0]), this.globalTransformMatrix.get([2, 1]), this.globalTransformMatrix.get([2, 2]));
        const posVec3 = new Vector3(this.globalTransformMatrix.get([3, 0]), this.globalTransformMatrix.get([3, 1]), this.globalTransformMatrix.get([3, 2]));

        return this.getLookAtLH(posVec3, forwardVector3, upVector3);
    }
}