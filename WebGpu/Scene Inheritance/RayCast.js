import {CollisionObject} from "./CollisionObject.js";
import {Vector3} from "./Vector3.js";
import {Logger} from "../Logger.js";

export class RayCast extends CollisionObject {
    constructor(options = {}) {
        const {
            name = "RayCast",
            length = 10,
            segmentLength = 0.5,
            size = 0.5
        } = options;

        super({...options, bounds: new Vector3(size,0,0), isTrigger: true});
        this.length = length;
        this.segmentLength = segmentLength;
    }

    /**
     * @param ignoreList : CollisionObject[]
     * @return {CollisionObject}
     * @constructor
     */
    async SendRC(ignoreList){
        let remainingLength = this.length;
        do{
            this.CalculateMatrix();
            this.CalculateGlobalMatrix()
            const collider = this.CheckIfColliding(ignoreList);
            if (collider !== null) {
                this.position = Vector3.Zero.copy();
                return collider;
            }
            remainingLength -= this.segmentLength;
            const forward = this.forward.scale(this.segmentLength);
            this.position = this.position.add(forward);
        } while (remainingLength > 0);


        this.position = Vector3.Zero.copy();
        return null;
    }

    async SendRCTrigger(ignoreList){
        let remainingLength = this.length;
        do{
            this.CalculateMatrix();
            this.CalculateGlobalMatrix()
            const collider = this.CheckIfCollidingTrigger(ignoreList);
            if (collider !== null && collider.isTrigger) {
                this.position = Vector3.Zero.copy();
                return collider;
            }
            remainingLength -= this.segmentLength;
            const forward = this.forward.scale(this.segmentLength);
            this.position = this.position.add(forward);
        } while (remainingLength > 0);


        this.position = Vector3.Zero.copy();
        return null;
    }

    /**
     * @param ignoreList : CollisionObject[]
     * @return {CollisionObject|null}
     * @constructor
     */
    CheckIfColliding(ignoreList){
        for (let shape in this.gpu.registeredShapes){
            let obj = this.gpu.registeredShapes[shape];
            if (obj instanceof CollisionObject && obj.ID !== this.ID){
                if (ignoreList[obj.ID] === undefined) {
                    const isValid = this.LocationValidation(this.position, obj);
                    if (!isValid) {
                        return obj;
                    }
                }
            }
        }
        return null;
    }

    /**
     * @param ignoreList : CollisionObject[]
     * @return {CollisionObject|null}
     * @constructor
     */
    CheckIfCollidingTrigger(ignoreList){
        for (let shape in this.gpu.registeredShapes){
            let obj = this.gpu.registeredShapes[shape];
            if (obj instanceof CollisionObject && obj.ID !== this.ID && obj.isTrigger){
                if (ignoreList[obj.ID] === undefined) {
                    const isValid = this.LocationValidation(this.position, obj);
                    if (!isValid) {
                        return obj;
                    }
                }
            }
        }
        return null;
    }
}