// models/Square.js
import SquareBase from "./SquareBase.js";
import Railroad from "./Railroad.js";

export default function(data) {
    if (data.type === "railroad") {
        return new Railroad(data);
    }
    return new SquareBase(data);
}
