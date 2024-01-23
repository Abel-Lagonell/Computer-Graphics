export class Object {
    constructor(
        x,y,id
    ) {
        this.x = x;
        this.y = y;
        this.id = id;
    }
}

// Other Object in the game

export class Potion extends Object{
    constructor(x, y) {
        super(x, y, -1);
    }
}