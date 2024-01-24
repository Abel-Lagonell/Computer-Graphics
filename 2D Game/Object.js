export class Object {
    x;
    y;
    constructor(
        x,y
    ) {
        this.x = x;
        this.y = y;
    }

    xAdd(){
        this.x++;
    }

    xMinus(){
        this.x--;
    }

    yAdd(){
        this.y++;
    }

    yMinus(){
        this.y--;
    }


}

// Other Object in the game
export class Potion extends Object{
    constructor(x, y) {
        super(x, y);
        //calculate hp regen randomly
    }
}