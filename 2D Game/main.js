import {Object, Potion} from "./Object.js";
import {Actor, Hero} from "./Actor.js";

class Main {
    ctx;
    canvas;

    constructor(canvas, ctx) {
        this.ctx = ctx;
        this.canvas = canvas;
        // Height = 13 with Width = 20
        this.playArea = [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ];
        this.hero = new Hero(2,1, 20, 5, 5, "./MiniSwordMan.png")
        this.CR1 = new Actor(15, 16, 5, 2, 0, "./MiniGoblin.png")
        this.CR2 = new Actor(10, 16, 10, 3, 1, "./MiniOrcBerserker.png")
        this.CR3 = new Actor(5, 16, 15, 4, 2, "./MiniWargRider.png")

        this.actors = [this.hero, this.CR1, this.CR2, this.CR3]

    }

    tryMove(hero, direction){
        let arr = this.playArea
        switch (direction) {
            case 0: //Up
                if (arr[hero.x][hero.y-1] >= 1) return;
                for (let actor of this.actors) {
                    if (actor.y === hero.y - 1 && actor.x === hero.x) actor.takeDmg(hero.dmg);
                }
                hero.move(direction);
                break;
            case 1: //Right
                if (arr[hero.x+1][hero.y] >= 1) return;
                for (let actor of this.actors) {
                    if (actor.x === hero.x + 1 && actor.y === hero.y) actor.takeDmg(hero.dmg);
                }
                hero.move(direction);
                break;
            case 2: //Down
                if (arr[hero.x][hero.y+1] >= 1) return;
                for (let actor of this.actors) {
                    if (actor.y === hero.y + 1 && actor.x === hero.x) actor.takeDmg(hero.dmg);
                }
                hero.move(direction);
                break;
            case 3: //Left
                if (arr[hero.x-1][hero.y] >= 1) return;
                for (let actor of this.actors) {
                    if (actor.x === hero.x - 1 && actor.y === hero.y) actor.takeDmg(hero.dmg);
                }
                hero.move(direction);
                break;
        }
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
        this.renderActor()
    }

    renderActor() {
        for (let actor of this.actors){
            let img = this.createImg(actor);
            img.onload = () => {
                if (actor.hp <= 0) return;
                if (!!actor.id) this.drawHealth();
                ctx.drawImage(img, actor.x*64, actor.y*64, 64, 64);
            };
        }
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

    checkKey(e){
        let str
        switch (e.keyCode) {
            case 37:
                this.tryMove(this.hero, 3);
                break;
            case 38:
                this.tryMove(this.hero, 0);
                break;
            case 39:
                this.tryMove(this.hero, 1);
                break;
            case 40:
                this.tryMove(this.hero, 2);
                break;
        }
        this.clear()
        this.render()
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




