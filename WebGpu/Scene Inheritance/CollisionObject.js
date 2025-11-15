import {Transform} from "./Transform";
import {Vector3} from "./Vector3";
import {Shape} from "./Shape/Shape.js";

class CollisionObject extends Transform {
    constructor(options = {}) {
        const {
            name = "CollisionObject",
            position = Vector3.Zero.copy(),
            rotation = Vector3.Zero.copy(),
            scale = Vector3.One.copy(),
            boundSize = new Shape,
        } = options;
        
        super(name,{...options});
    }

    OnTriggerEnter(){}
    
    OnCollisionEnter(){}
}