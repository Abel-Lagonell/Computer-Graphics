import {Object} from "./Object.js"

export class Actor extends Object{
    src = "";

    constructor(
        x, y, hp, dmg, def, src
    ) {
        super(x, y);
        this.maxHp = hp;
        this.dmg = dmg;
        this.def = def;
        this.src = src;
        this.hp = this.maxHp;
    }

    takeDmg(dmg){
        const totalDMG = dmg-this.def;
        let attack = totalDMG>0? totalDMG: 1;
        attack *= Math.floor(Math.random()*6)+1;
        this.hp -= attack;
        console.log(this.hp);
    }

    //Direction in which the actor is going to move {0:up, 1:right, 2:down, 3:left}
    move(direction) {
        switch (direction) {
            case 0:
                this.yMinus();
                break;
            case 1:
                this.xAdd();
                break;
            case 2:
                this.yAdd();
                break;
            case 3:
                this.xMinus();
                break;
        }
    }
}

export class Hero extends Actor{
    id = "Hero"
    constructor(
        x, y, hp, dmg, def, imgSrc
    ) {
        super(x, y, hp, dmg, def, imgSrc);
    }

    heal(potion) {
        this.hp += potion;
    }
}
