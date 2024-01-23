import {Object} from "./Object.js"

export class Actor extends Object{
    constructor(
        x, y, id, hp, dmg, def, imgSrc
    ) {
        super(x,y,id);
        this.maxHp = hp;
        this.dmg = dmg;
        this.def = def;
        this.imgsrc = imgSrc;
        this.hp = this.maxHp;
    }

    modify_XY(x,y) {
        this.x = x;
        this.y = y;
    }

    takeDmg(dmg, def){
        const totalDMG = dmg-def;
        this.hp -= totalDMG>0? totalDMG: 1;
    }
}

export class Hero extends Actor{
    constructor(
        x, y, id, hp, dmg, def, imgSrc
    ) {
        super(x,y,0, hp, dmg, def, imgSrc);
    }

    heal(potion) {
        this.hp += potion;
    }
}
