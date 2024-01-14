import {Slot_machine} from "./slot_machine.js";

class Main {
    //Class Variables
    money = 100;
    slot_machines = [];
    section = document.createElement("section");

    constructor() {
        //Appending Dynamic Section to HTML
        document.addEventListener("DOMContentLoaded", () => {
            this.section.className="txtSection"
            document.body.appendChild(this.section);
            let section = document.createElement("section");
            section.id = "slotMachine"
            document.body.appendChild(section);
        });
        // Create instances of Slot_machine and add them to the array
        for (let i = 0; i < 3; i++) {
            const slotMachine = new Slot_machine();
            this.slot_machines.push(slotMachine);
        }
    }
    
    playAll() {
        if (this.money > 0){
            var total_winnings = 0;
            //Calling the slot machine play function
            for (const machine of this.slot_machines) {
                this.money--;
                machine.play();
                total_winnings += machine.last_amount_won;
            }
            this.money += total_winnings;

            let condition = function() {
                if (total_winnings > 0 ) return "Round's Total Winnings: " + total_winnings;
                else return "Game Over"
            }()

            this.section.innerHTML = "Total Money: " + this.money + "<br>" + condition
        } else this.section.innerHTML = "NO MORE MONEY :(";
    }
}

//Button functionality
let main = new Main();
function playGame() {main.playAll(); return 0;}
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("play").addEventListener("click", playGame)
});