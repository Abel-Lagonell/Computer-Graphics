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
         this.#base = Math.floor(Math.random()*101)
         this.#other = Math.floor(Math.random()*101)

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
             picture.src = "https://images.unsplash.com/photo-1595420832643-faf4aaf65c5b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
             picture.alt = "Happy Face"
         } else {
             picture.src = "https://images.unsplash.com/photo-1453227588063-bb302b62f50b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
             picture.alt = "Sad Face"
         }
     }
}

let game= new LuckyNumbers()
function playLuckyNumbers() {
    game.playGame()
}