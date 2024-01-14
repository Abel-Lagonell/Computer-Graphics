export class Slot_machine {
    //Class Variables
    #last_amount_won;
    #nums;
    #img_list = this.make_img_list();
    //Dictionary for the different Icons
    #slot_machine_icons = [
        {0 : "https://img.icons8.com/external-those-icons-fill-those-icons/96/external-Seven-casino-and-leisure-those-icons-fill-those-icons.png"},
        {1 : "https://img.icons8.com/cotton/64/banana.png"},
        {2 : "https://img.icons8.com/cotton/64/watermelon-2.png"},
        {3 : "https://img.icons8.com/cotton/64/sour-lemon-.png"},
        {4 : "https://img.icons8.com/cotton/64/cherry--v1.png"},
        {5 : "https://img.icons8.com/cotton/64/grape.png"},
        {6 : "https://img.icons8.com/cotton/64/orange--v1.png"}
    ]

    get last_amount_won(){
        return this.#last_amount_won
    }

    constructor() {
        //Declaring last_amount_won to zero
        this.#last_amount_won = 0;
        //Loading In the image list
        document.addEventListener("DOMContentLoaded", () => {
            let slot_section = document.createElement("section");
            slot_section.className= "slotSection";
            let outerDiv = document.createElement("div");
            outerDiv.className = "outerDiv"
            for (let img of this.#img_list){
                img.src = this.getIconUrl(this.randomNumbers()[0])
                let inner_div = document.createElement("div");
                inner_div.className = "innerDiv"
                inner_div.appendChild(img);
                outerDiv.appendChild(inner_div);
            }
            this.#img_list[1].parentElement.className += " middleDiv";
            slot_section.appendChild(outerDiv);
            document.getElementById("slotMachine").appendChild(slot_section);

        });
    }

    //Playing the Slot machines
    play() {
        this.#nums = this.randomNumbers();
        for (let i = 0; i < this.#img_list.length; i++){
            this.#img_list[i].src = this.getIconUrl(this.#nums[i]);
            this.#img_list[i].alt = this.#nums[i];
        }
        this.#last_amount_won =  this.calc_winnings(this.#nums)
    }

    //Function to make the list with the right formatting
    make_img_list() {
        let img1 = document.createElement("img");
        let img2 = document.createElement("img");
        let img3 = document.createElement("img");
        let img_list = [img1, img2, img3];
        for (let img of img_list){
            img.height = 64;
            img.width = 64;
        }
        return img_list;
    }

    //Picking 3 random numbers from [0-6]
    randomNumbers(){
        let numberList = [0,0,0];
        for (let i= 0; i<3; i++){numberList[i] = Math.floor(Math.random()*7)}
        return numberList;
    }

    //Using the Dictionary to get the correct URL
    getIconUrl(key) {
        const iconObject = this.#slot_machine_icons.find(obj => key in obj);
        return iconObject ? iconObject[key] : null;
    }

    //Calculate the total winnings of the slot machine
    calc_winnings(num_list){
        let first = num_list[0];
        let second = num_list[1];
        let third = num_list[2];

        if (first === second && second === third) {
            if (first === 0) return 14;
            else return 7;
        } else if (first === second){
            if (first === 0) return 3;
            else return 2;
        } else if (first === 0) return 1;
        else return 0;
    }
}