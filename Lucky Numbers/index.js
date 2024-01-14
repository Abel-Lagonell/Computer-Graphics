class LuckyNumbers {
     #base= 0
     #other= 0
     #wins =0;
     #loss=0;
    numbers;
    outcome;
    picture;

     constructor(picture, numbers, outcome) {
         document.addEventListener("DOMContentLoaded", function() {
             this.picture = document.getElementById("picture")
             this.numbers = document.getElementById("numbers")
             this.outcome = document.getElementById("outcome")
         })
     }

     playGame(){
         this.#base = Math.floor(Math.random()*100)
         this.#other = Math.floor(Math.random()*100)

         this.numbers.innerHTML = "The Computer: " + this.#base + ", Your Number: " + this.#other
         this.outcome.innerHTML = (() => {
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
             this.picture.src = "./Happy.jpg"
             this.picture.alt = "Happy Face"
         } else {
             this.picture.src = "./sad.jpg"
             this.picture.alt = "Sad Face"
         }
     }
}

let game= new LuckyNumbers()
function playLuckyNumbers() {
    game.playGame()
}