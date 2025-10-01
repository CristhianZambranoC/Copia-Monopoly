// models/Railroad.js
import Square from "./SquareBase.js";

class Railroad extends Square {
    constructor(data) {
        super(data);

        if (data.type !== "railroad") {
            throw new Error(`El id ${data.id} no es un ferrocarril`);
        }
    }

    /**
     * Renta dependiendo de cuántos ferrocarriles tenga el dueño
     */
    getRentOwned(count) {
        if (this.isMortgaged) return 0;
        return this.rent[count.toString()] || 0;
    }

    /**
     * Valor total del ferrocarril
     */
    getTotalValue() {
        if (this.isMortgaged) return -this.mortgage;
        return this.price;
    }
}

export default Railroad;
