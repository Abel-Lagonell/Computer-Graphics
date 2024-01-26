import {Actor, Hero} from "./Actor.js";
import {Object, Potion} from "./Object.js";

class Main {
    ctx;
    canvas;

    constructor(canvas, ctx) {
        this.playable = true;
        this.ctx = ctx;
        this.canvas = canvas;
        // Height = 20 with Width = 20
        this.playArea = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
            [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1],
            [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
            [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1],
            [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 1],
            [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
            [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ];

        this.hero = new Hero(2,1, 20, 5, 5, "./MiniSwordMan.png")
        this.CR1 = new Actor(15, 16, 5, 2, 0, "./MiniGoblin.png")
        this.CR2 = new Actor(10, 16, 10, 3, 1, "./MiniOrcBerserker.png")
        this.CR3 = new Actor(5, 16, 15, 4, 2, "./MiniWargRider.png")
        this.hPotion1 = new Potion(18,10, "./HPotion.png")
        this.hPotion2 = new Potion(1, 10, "./HPotion.png")

        this.potions = [this.hPotion1, this.hPotion2]
        this.actors = [this.CR1, this.CR2, this.CR3]

    }

    tryMove(self, direction){ //Return Hit something (index) if index > arr.size then its hero or Wall (-1)
        let arr = this.playArea
        let actors = this.actors.slice()
        actors.push(this.hero);

        switch (direction) {
            case 0: //Up
                if (arr[self.x][self.y-1] >= 1) return -1;
                for (let i =0; i < actors.length; i++) {
                    if (actors[i].y === self.y - 1 && actors[i].x === self.x) return i;
                }
                break;
            case 1: //Right
                if (arr[self.x+1][self.y] >= 1) return -1;
                for (let i =0; i < actors.length; i++) {
                    if (actors[i].x === self.x + 1 && actors[i].y === self.y) return i;
                }
                break;
            case 2: //Down
                if (arr[self.x][self.y+1] >= 1) return -1;
                for (let i =0; i < actors.length; i++) {
                    if (actors[i].y === self.y + 1 && actors[i].x === self.x) return i;
                }
                break;
            case 3: //Left
                if (arr[self.x-1][self.y] >= 1) return -1;
                for (let i =0; i < actors.length; i++) {
                    if (actors[i].x === self.x - 1 && actors[i].y === self.y) return i;
                }
                break;
        }
    }

    randMove(monster) {
        let direction = Math.floor(Math.random() * 4);
        let result = this.tryMove(monster, direction);
        switch (result) {
            case -1: break;
            case 0:  break;
            case 1:  break;
            case 2:  break;
            case 3:  this.hero.takeDmg(monster.dmg); break;
            default: monster.move(direction);
        }
    }


    heroMove(direction){
        let result = this.tryMove(this.hero, direction);
        switch (result) {
            case -1: break;
            case 0: this.actors[0].takeDmg(this.hero.dmg); break;
            case 1: this.actors[1].takeDmg(this.hero.dmg); break;
            case 2: this.actors[2].takeDmg(this.hero.dmg); break;
            default: this.hero.move(direction);
        }
        for (let i =0; i < this.potions.length; i++) {
            if (this.potions[i].x === this.hero.x && this.potions[i].y === this.hero.y){
                this.hero.heal(this.potions[i].potionRegen);
                this.potions[i].gotten();
            }
        }
        //Could be made better to allow for variable amount of enemies and potions.
    }

    drawHealth() {
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(this.hero.x*64 +15, this.hero.y*64 +2, 30, 5);
        let percent = Math.floor( (this.hero.hp / this.hero.maxHp) * 10) *3;
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(this.hero.x*64 +15, this.hero.y*64 +2, percent, 5);

    }

    createImg(actor){
        let img = document.createElement("img");
        img.src = actor.src;
        img.alt = "alt"
        return img;
    }

    render(){
        this.renderWalls()
        this.renderHero()
        this.drawHealth()
        for (let actor of this.actors) {
            this.renderActor(actor)
        }
        for (let potions of this.potions){
            this.renderActor(potions)
        }
    }

    renderActor(object) {
        let img = this.createImg(object);
        img.onload = () => {
            if (object.hp <= 0) return;
            ctx.drawImage(img, object.x*64, object.y*64, 64, 64);
        };
    }

    renderHero(){
        let img = this.createImg(this.hero);
        img.onload = () => {
            if (this.hero.hp <= 0) return;
            ctx.drawImage(img, this.hero.x*64, this.hero.y*64, 64, 64);
        };
    }

    renderWalls(){
        for (let i =0; i<20; i++){
            for (let j  =0; j<20; j++){
                switch (this.playArea[i][j]) {
                    case 1: this.drawBox(i*64,j*64, "red"); break;
                    case 2: this.drawCircle(i*64, j*64, "green"); break;
                }
            }
        }
    }

    clear() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height)
    }

    drawBox(x, y, color){
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, 64 ,64);
    }

    drawCircle(x, y, color){
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x+32 ,y+32, 32, 0 , Math.PI*2, true);
        this.ctx.fill();
    }

    drawText(str){
        ctx.font = "60px Jokerman";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(str, canvas.width/2, canvas.height/2);
    }

    checkKey(e){
        if (!this.playable) return;
        switch (e.keyCode) {
            case 37:
                this.heroMove(3);
                break;
            case 38:
                this.heroMove(0);
                break;
            case 39:
                this.heroMove(1);
                break;
            case 40:
                this.heroMove(2);
                break;
        }
        for (let actor of this.actors){
            this.randMove(actor);
        }
        this.clear()
        this.render()
        this.checkGameState()
    }

    checkGameState() {
        if (this.actors.length === 0){
            this.win()
            this.playable = false;
        }
        else if (this.hero.hp < 0){
            this.lose()
            this.playable = false;
        }
        for (let actor of this.actors){
            if (actor.hp <= 0){
                const index = this.actors.indexOf(actor);
                if (index > -1) {
                    this.actors.splice(index, 1);
                }
            }
        }
    }

    win() {
        this.clear()
        this.drawText("YOU WIN")
    }

    lose() {
        this.clear()
        this.drawText("GAME OVER")
    }
}

let canvas = document.createElement("canvas")
canvas.id = "canvas";
canvas.height = 1280;
canvas.width = 1280;
let ctx = canvas.getContext("2d")
let main = new Main(canvas, ctx);

document.addEventListener("DOMContentLoaded", function() {
    let div = document.createElement("div");
    div.appendChild(canvas)
    document.body.appendChild(div);
});
document.onkeydown = ev => main.checkKey(ev);



main.render()




