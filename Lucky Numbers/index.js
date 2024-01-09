var numbers, outcome, picture
document.addEventListener("DOMContentLoaded", function() {
    numbers = document.getElementById("numbers")
    outcome = document.getElementById("outcome")
    picture = document.getElementById("picture")
});

class LuckyNumbers {
    #base= 0
    #other= 0
    #wins =0;
    #loss=0;

     constructor() {
     }

     playGame(){
         this.#base = Math.floor(Math.random()*100)
         this.#other = Math.floor(Math.random()*100)

         numbers.innerHTML = "The Computer: " + this.#base + ", Your Number: " + this.#other
         outcome.innerHTML = (() => {
             if (this.#base > this.#other) {
                 this.#wins++
                 return "You Lose. Total => Win: " + this.#wins + " Losses: " + this.#loss
             } else if (this.#base === this.#other) {
                 return "You Tie. Total => Win: " + this.#wins + " Losses: " + this.#loss
             } else {
                 this.#loss++
                 return "You Win. Total => Win: " + this.#wins + " Losses: " + this.#loss
             }
         })()
         this.updateImage()
     }

     updateImage(){
         if (this.#wins>this.#loss){
             picture.src = "./Happy.jpg"
             picture.alt = "Happy Face"
         } else {
             picture.src = "./sad.jpg"
             picture.alt = "Sad Face"
         }
     }
}

let game= new LuckyNumbers()
function playLuckyNumbers() {
    game.playGame()
}