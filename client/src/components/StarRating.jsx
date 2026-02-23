import starHalf from "../assets/images/starHalf.svg";
import starFull from "../assets/images/starFull.svg";
import starEmpty from "../assets/images/starEmpty.svg";

const StarRating = ({averageRating, large = false}) => {
    const rating = Math.floor(averageRating * 2) / 2;
    const stars = [];

    for (let i = 0; i < 5; i++) {
        if (rating >= i + 1) {
            stars[i] = "full";
        } else if (rating === i + 1 + 0.5) {
            stars[i] = "half";
        } else {
            stars[i] = "empty";
        }
    }

    return (
        <div className={`flex items-center ${large? "gap-1.5 lg:gap-2": "gap-1"}`}>
            {stars.map((star, index) => {
                return (
                    <img key={index} src={star === "full"? starFull :(star === "half"? starHalf: starEmpty)} alt="star" 
                    className={`${large? "size-4.75 lg:size-6": "size-4 lg:size-4.75"}`} />
                )
            })}
        </div>
    )
}

export default StarRating;
