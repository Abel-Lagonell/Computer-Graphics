import {Transform} from "./Transform.js";
import {Vector3} from "./Vector3.js";

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

    LocationValidation(position, other) {
        return CollisionObject.LocationValidation(position, this, other);
    }

    static LocationValidation(position, collisionObjectOne, collisionObjectTwo) {
        // If either object doesn't exist, no collision
        if (!collisionObjectOne || !collisionObjectTwo) {
            return true; // Position is valid
        }

        // Store the original position
        const originalPosition = collisionObjectOne.position.copy();

        // Temporarily move the first object to the proposed position
        collisionObjectOne.position = position.copy();

        // Get bounds for both objects
        const bounds1 = collisionObjectOne.bounds;
        const bounds2 = collisionObjectTwo.bounds;

        // Determine object types based on bounds
        const isCircle1 = bounds1.y === 0 || !bounds1.y;
        const isCircle2 = bounds2.y === 0 || !bounds2.y;

        let collides = false;


        if (!isCircle1 && !isCircle2) {
            // Box vs Box collision (AABB)
            const min1 = {
                x: collisionObjectOne.position.x - bounds1.x / 2,
                y: collisionObjectOne.position.z - bounds1.y / 2
            };
            const max1 = {
                x: collisionObjectOne.position.x + bounds1.x / 2,
                y: collisionObjectOne.position.z + bounds1.y / 2
            };

            const min2 = {
                x: collisionObjectTwo.position.x - bounds2.x / 2,
                y: collisionObjectTwo.position.z - bounds2.y / 2
            };
            const max2 = {
                x: collisionObjectTwo.position.x + bounds2.x / 2,
                y: collisionObjectTwo.position.z + bounds2.y / 2
            };

            collides = (
                min1.x <= max2.x && max1.x >= min2.x &&
                min1.y <= max2.y && max1.y >= min2.y
            );
        } else if (isCircle1 && isCircle2) {
            // Circle vs Circle collision
            const radius1 = bounds1.x;
            const radius2 = bounds2.x;

            const dx = collisionObjectTwo.position.x - collisionObjectOne.position.x;
            const dy = collisionObjectTwo.position.z - collisionObjectOne.position.z;
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
                x: box.position.x - boxBounds.x / 2,
                y: box.position.z - boxBounds.y / 2
            };
            const boxMax = {
                x: box.position.x + boxBounds.x / 2,
                y: box.position.z + boxBounds.y / 2
            };

            const closestX = Math.max(boxMin.x, Math.min(circle.position.x, boxMax.x));
            const closestY = Math.max(boxMin.y, Math.min(circle.position.z, boxMax.y));

            const dx = circle.position.x - closestX;
            const dy = circle.position.z - closestY;
            const distanceSquared = dx * dx + dy * dy;

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