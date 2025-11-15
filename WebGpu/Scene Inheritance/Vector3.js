export class Vector3 {
    /**[1,1,1]*/
    static One = new Vector3(1, 1, 1);
    /**[0,0,0]*/
    static Zero = new Vector3(0,0,0);
    /**[0,1,0]*/
    static Up = new Vector3(0,1,0);
    /**[0,-1,0]*/
    static Down = new Vector3(0,-1,0);
    /**[1,0,0]*/
    static Right = new Vector3(1,0,0);
    /**[-1,0,0]*/
    static Left = new Vector3(-1,0,0);
    /**[0,0,-1]*/
    static Forward = new Vector3(0,0,-1);
    /**[0,0,1]*/
    static Backward = new Vector3(0,0,1);
    
    /**
     * @param array : number[]
     * @returns {Vector3}
     */
    static fromArray (array) {
        return new Vector3(array[0], array[1], array[2]);
    }
    
    static Empty(){
        return new Vector3(Infinity, Infinity, Infinity)
    }

    /**
     * @param x : number
     * @param y : number
     * @param z : number
     */
    constructor(x, y, z) {
        /**
         * @type {number[]}
         */
        this.array = [x, y, z]
    }
    
    get x() {
        return this.array[0];
    }

    get y() {
        return this.array[1];
    }

    get z() {
        return this.array[2];
    }

    /**
     * @param val : number
     */
    set x(val) {
        this.array[0] = val
    }

    /**
     * @param val : number
     */
    set y(val) {
        this.array[1] = val
    }

    /**
     * @param val : number
     */
    set z(val) {
        this.array[2] = val
    }

    valueOf(){
        return this.array;
    }
    
    [Symbol.iterator](){
        return this.array[Symbol.iterator]();
    }


    /**
     * @param other : Vector3
     * @returns {Vector3}
     */
    add(other) {
        return new Vector3(
            this.x + other.x,
            this.y + other.y,
            this.z + other.z,
        )
    }

    /**
     * @param other : Vector3
     * @returns {Vector3}
     */
    subtract(other) {
        return new Vector3(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z,
        );
    }

    /**
     * @param scalar : number
     * @returns {Vector3}
     */
    scale(scalar) {
        return new Vector3(
            this.x * scalar,
            this.y * scalar,
            this.z * scalar,
        );
    }

    /**
     * @param other : Vector3
     * @returns {number}
     */
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    /**
     * @param other : Vector3
     * @returns {Vector3}
     */
    cross(other) {
        return new Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    /**
     * @returns {number}
     */
    magnitude() {
        return Math.sqrt(this.dot(this));
    }

    /**
     * @returns {Vector3} 
     */
    normalize() {
        const mag = this.magnitude();
        return mag === 0 ? new Vector3(0, 0, 0) : this.scale(1 / mag);
    }

    /**
     * @param other : Vector3
     * @returns {number}
     */
    distanceTo(other) {
        return this.subtract(other).magnitude();
    }

    toString() {
        return `[${this.array.join(",")}]`;
    }
    
    copy(){
        return Vector3.fromArray(this.array);
    }

    /**
     * @param other : Vector3
     * @returns {boolean}
     */
    equals(other){
        return (this.x === other.x) && (this.y === other.y) && (this.z === other.z);     
    }

    /**
     * @param start : Vector3
     * @param end : Vector3
     * @param amt : number
     * @returns {Vector3}
     * @constructor
     */
    static Lerp(start, end, amt) {
        return start.scale(1-amt).add(end.scale(amt));
    }
}