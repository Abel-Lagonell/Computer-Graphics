import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";
import {Logger} from "../Logger.js";

export class CollisionObject extends Transform {
    constructor(options = {}) {
        const {
            name = "CollisionObject",
            bounds = Vector3.Empty().copy(),
            isTrigger = false,
        } = options;

        super(name, {...options});

        this.bounds = bounds;
        this.isTrigger = isTrigger;
    }


    OnCollisionEnter(otherCollisionObject) {
        document.dispatchEvent(new CustomEvent("onCollisionEnter", {
            thisCollisionObject: this,
            otherCollisionObject: otherCollisionObject,
        }))
    };

    OnTriggerEnter(otherCollisionObject) {
        document.dispatchEvent(new CustomEvent("onCollisionEnter", {
            thisCollisionObject: this,
            otherCollisionObject: otherCollisionObject,
        }))
    }

    LocationValidation(position, other, log =false) {
        return CollisionObject.LocationValidation(position, this, other, log);
    }

    /**
     * @param position : Vector3
     * @param collisionObjectOne : CollisionObject
     * @param collisionObjectTwo : CollisionObject
     * @param log : boolean
     * @returns {boolean}
     * @constructor
     */
    static LocationValidation(position, collisionObjectOne, collisionObjectTwo, log = false) {
        // If either object doesn't exist, no collision
        if (!collisionObjectOne || !collisionObjectTwo) {
            return true; // Position is valid
        }

        // Store the original position
        const originalPosition = collisionObjectOne.position.copy();

        // Temporarily move the first object to the proposed position
        collisionObjectOne.position = position.copy();

        // Get bounds for both objects
        const bounds1 = new Vector3(
            collisionObjectOne.bounds.x * collisionObjectOne.parent.scale.x,
            collisionObjectOne.bounds.y * collisionObjectOne.parent.scale.y,
            0);

        const bounds2 = new Vector3(
            collisionObjectTwo.bounds.x * collisionObjectTwo.parent.scale.x,
            collisionObjectTwo.bounds.y * collisionObjectTwo.parent.scale.y,
            0);

        // Determine object types based on bounds
        const isCircle1 = bounds1.y === 0 || !bounds1.y;
        const isCircle2 = bounds2.y === 0 || !bounds2.y;

        let collides = false;


        if (!isCircle1 && !isCircle2) {
            // Box vs Box collision (AABB)
            const min1 = {
                x: collisionObjectOne.globalPosition.x - bounds1.x / 2,
                y: collisionObjectOne.globalPosition.z - bounds1.y / 2
            };
            const max1 = {
                x: collisionObjectOne.globalPosition.x + bounds1.x / 2,
                y: collisionObjectOne.globalPosition.z + bounds1.y / 2
            };

            const min2 = {
                x: collisionObjectTwo.globalPosition.x - bounds2.x / 2,
                y: collisionObjectTwo.globalPosition.z - bounds2.y / 2
            };
            const max2 = {
                x: collisionObjectTwo.globalPosition.x + bounds2.x / 2,
                y: collisionObjectTwo.globalPosition.z + bounds2.y / 2
            };

            collides = (
                min1.x <= max2.x && max1.x >= min2.x &&
                min1.y <= max2.y && max1.y >= min2.y
            );
        } else if (isCircle1 && isCircle2) {
            // Circle vs Circle collision
            const radius1 = bounds1.x;
            const radius2 = bounds2.x;

            const dx = collisionObjectTwo.globalPosition.x - collisionObjectOne.globalPosition.x;
            const dy = collisionObjectTwo.globalPosition.z - collisionObjectOne.globalPosition.z;
            const distanceSquared = dx * dx + dy * dy;
            const radiusSum = radius1 + radius2;

            collides = distanceSquared < (radiusSum * radiusSum);
        } else {
            // Box vs Circle collision (or Circle vs Box)
            const circle = isCircle1 ? collisionObjectOne : collisionObjectTwo;
            const box = isCircle1 ? collisionObjectTwo : collisionObjectOne;
            const circleBounds = isCircle1 ? bounds1 : bounds2;
            const boxBounds = isCircle1 ? bounds2 : bounds1;

            const radius = circleBounds.x;

            // Find the closest point on the box to the circle's center
            const boxMin = {
                x: box.globalPosition.x - boxBounds.x / 2,
                y: box.globalPosition.z - boxBounds.y / 2
            };
            const boxMax = {
                x: box.globalPosition.x + boxBounds.x / 2,
                y: box.globalPosition.z + boxBounds.y / 2
            };

            const closestX = Math.max(boxMin.x, Math.min(circle.globalPosition.x, boxMax.x));
            const closestY = Math.max(boxMin.y, Math.min(circle.globalPosition.z, boxMax.y));

            const dx = circle.globalPosition.x - closestX;
            const dy = circle.globalPosition.z - closestY;
            const distanceSquared = dx * dx + dy * dy;

            if (log){
                console.log(boxBounds.array, box.globalPosition.array, boxMax, boxMin)
            }

            collides = distanceSquared < (radius * radius);
        }

        // Restore the original position
        collisionObjectOne.position = originalPosition;

        if (!collides) {
            if (collisionObjectOne.isTrigger || collisionObjectTwo.isTrigger) {
                collisionObjectOne.OnTriggerEnter(collisionObjectTwo);
                collisionObjectTwo.OnTriggerEnter(collisionObjectOne);
            } else {
                collisionObjectOne.OnCollisionEnter(collisionObjectTwo);
                collisionObjectTwo.OnCollisionEnter(collisionObjectOne);
            }
        }

        // Return true if position is valid (no collision), false if collision detected
        return !collides;
    }
}