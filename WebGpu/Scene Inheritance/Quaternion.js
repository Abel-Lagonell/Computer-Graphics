import {Vector3} from "./Vector3.js";

export class Quaternion {
    static get Identity () {
        return new Quaternion(1,0,0,0)
    }   
    
    constructor(w=1,x=0,y=0,z=0) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * 
     * @param euler : Vector3
     * @returns {Quaternion}
     */
    static fromEuler(euler) {
        const cx = Math.cos(euler.x * 0.5);
        const sx = Math.sin(euler.x * 0.5);
        const cy = Math.cos(euler.y * 0.5);
        const sy = Math.sin(euler.y * 0.5);
        const cz = Math.cos(euler.z * 0.5);
        const sz = Math.sin(euler.z * 0.5);

        return new Quaternion(
            cx * cy * cz + sx * sy * sz,
            sx * cy * cz - cx * sy * sz,
            cx * sy * cz + sx * cy * sz,
            cx * cy * sz - sx * sy * cz
        ); 
    }

    /**
     * @returns {Vector3}
     */
    get Euler(){
        // Roll (x-axis rotation)
        const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
        const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);

        // Pitch (y-axis rotation)
        const sinp = 2 * (this.w * this.y - this.z * this.x);
        const pitch = Math.abs(sinp) >= 1
            ? Math.sign(sinp) * Math.PI / 2
            : Math.asin(sinp);

        // Yaw (z-axis rotation)
        const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
        const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);

        return new Vector3(roll, pitch, yaw);
    }

    /**
     * @returns {math.Matrix}
     */
    get Matrix() {
        const w = this.w, x = this.x, y = this.y, z = this.z;
        const w2 = w * w, x2 = x * x, y2 = y * y, z2 = z * z;

        return math.matrix([
            [1 - 2*(y2 + z2), 2*(x*y - w*z), 2*(x*z + w*y), 0],
            [2*(x*y + w*z), 1 - 2*(x2 + z2), 2*(y*z - w*x), 0],
            [2*(x*z - w*y), 2*(y*z + w*x), 1 - 2*(x2 + y2), 0],
            [0, 0, 0, 1]
        ]);
    }

    /**
     * Extract quaternion from rotation matrix
     * @param {math.Matrix} matrix - 4x4 transformation matrix
     * @returns {Quaternion}
     */
    static fromMatrix(matrix) {
        // First normalize the matrix to remove scaling
        const m11 = math.subset(matrix, math.index(0, 0));
        const m12 = math.subset(matrix, math.index(0, 1));
        const m13 = math.subset(matrix, math.index(0, 2));
        const m21 = math.subset(matrix, math.index(1, 0));
        const m22 = math.subset(matrix, math.index(1, 1));
        const m23 = math.subset(matrix, math.index(1, 2));
        const m31 = math.subset(matrix, math.index(2, 0));
        const m32 = math.subset(matrix, math.index(2, 1));
        const m33 = math.subset(matrix, math.index(2, 2));

        // Remove scaling
        let scaleX = Math.sqrt(m11 * m11 + m21 * m21 + m31 * m31);
        let scaleY = Math.sqrt(m12 * m12 + m22 * m22 + m32 * m32);
        let scaleZ = Math.sqrt(m13 * m13 + m23 * m23 + m33 * m33);

        // Handle negative scale
        const det = m11 * (m22 * m33 - m23 * m32) -
            m12 * (m21 * m33 - m23 * m31) +
            m13 * (m21 * m32 - m22 * m31);
        if (det < 0) scaleX = -scaleX;

        const nm11 = m11 / scaleX;
        const nm12 = m12 / scaleY;
        const nm13 = m13 / scaleZ;
        const nm21 = m21 / scaleX;
        const nm22 = m22 / scaleY;
        const nm23 = m23 / scaleZ;
        const nm31 = m31 / scaleX;
        const nm32 = m32 / scaleY;
        const nm33 = m33 / scaleZ;

        // Convert to quaternion using Shepperd's method
        const trace = nm11 + nm22 + nm33;
        let w, x, y, z;

        if (trace > 0) {
            const s = Math.sqrt(trace + 1.0) * 2;
            w = 0.25 * s;
            x = (nm32 - nm23) / s;
            y = (nm13 - nm31) / s;
            z = (nm21 - nm12) / s;
        } else if (nm11 > nm22 && nm11 > nm33) {
            const s = Math.sqrt(1.0 + nm11 - nm22 - nm33) * 2;
            w = (nm32 - nm23) / s;
            x = 0.25 * s;
            y = (nm12 + nm21) / s;
            z = (nm13 + nm31) / s;
        } else if (nm22 > nm33) {
            const s = Math.sqrt(1.0 + nm22 - nm11 - nm33) * 2;
            w = (nm13 - nm31) / s;
            x = (nm12 + nm21) / s;
            y = 0.25 * s;
            z = (nm23 + nm32) / s;
        } else {
            const s = Math.sqrt(1.0 + nm33 - nm11 - nm22) * 2;
            w = (nm21 - nm12) / s;
            x = (nm13 + nm31) / s;
            y = (nm23 + nm32) / s;
            z = 0.25 * s;
        }

        return new Quaternion(w, x, y, z);
    }

    /**
     * @param {Quaternion} other
     * @returns {Quaternion}
     */
    multiply(other) {
        return new Quaternion(
            this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z,
            this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
            this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
            this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w
        );
    }

    /**
     * Check if quaternions are equal (accounting for double-cover property)
     * @param {Quaternion} other
     * @param {number} epsilon
     * @returns {boolean}
     */
    equals(other, epsilon = 1e-6) {
        const dot = this.w * other.w + this.x * other.x + this.y * other.y + this.z * other.z;
        return Math.abs(Math.abs(dot) - 1) < epsilon;
    }

    normalize() {
        const length = Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
        if (length === 0) return Quaternion.Identity;
        return new Quaternion(this.w / length, this.x / length, this.y / length, this.z / length);
    }

    copy() {
        return new Quaternion(this.w, this.x, this.y, this.z);
    }
}