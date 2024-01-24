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

        this.actors = [this.hero, this.CR1]

    }

    tryMove(actor, direction){
        let arr = this.playArea
        switch (direction) {
            case 0: //Up
                if (arr[actor.x][actor.y-1] < 1){
                    actor.move(direction);
                }
                break;
            case 1: //Right
                if (arr[actor.x+1][actor.y] < 1){
                    actor.move(direction);
                }
                break;
            case 2: //Down
                if (arr[actor.x][actor.y+1] < 1){
                    actor.move(direction);
                }
                break;
            case 3: //Left
                if (arr[actor.x-1][actor.y] < 1){
                    actor.move(direction)
                }
                break;
        }
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




