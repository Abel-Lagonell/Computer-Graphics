export class Object {
    x;
    y;
    src = "";

    constructor(
        x,y, src
    ) {
        this.x = x;
        this.y = y;
        this.src = src;
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
    potionRegen

    constructor(x, y, src) {
        super(x, y, src);
        this.potionRegen = Math.floor(Math.random()*10)+1
    }

    gotten() {
        for (let i = 0; i <50; i++){
            this.xAdd()
        }
    }
}