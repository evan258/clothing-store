import { useState, useEffect, useRef } from "react";
import arrowLeft from "../assets/images/arrowLeft.svg";
import arrowRight from "../assets/images/arrowRight.svg";
import StarRating from "./StarRating";
import ReviewText from "./ReviewText";
import dayjs from "dayjs";


const HappyCustomers = () => {
    const [reviews, setReviews] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch("http://localhost:3000/highest/reviews");
                const data = await res.json();
                if (!res.ok) {
                    console.log(data.message);
                    return;
                }
                setReviews(data || []);
            } catch (err) {
                console.log(err);
            }
        }
        fetchReviews();
    }, []);

    const scroll = (direction) => {
        if (scrollRef.current && scrollRef.current.scrollWidth > scrollRef.current.clientWidth) {
            const scrollAmount = scrollRef.current.scrollWidth / reviews.length;

            scrollRef.current.scrollBy({
                left: (direction === "left") ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    }

    return (
        <div className="container pt-12.5 md:pt-15 lg:pt-18 xl:pt-20">
            <div className="max-w-310 mx-auto">
                <div className="flex justify-between items-end">
                    <h2>OUR HAPPY CUSTOMERS</h2>
                    <div className="flex gap-2 sm:gap-3 md:gap-4">
                        <button onClick={() => scroll("left")} className="size-6"><img className="w-full h-full" src={arrowLeft} alt="previous" /></button>
                        <button onClick={() => scroll("right")} className="size-6"><img className="w-full h-full" src={arrowRight} alt="next" /></button>
                    </div>
                </div>
                <div ref={scrollRef} className="pt-6 md:pt-8 lg:pt-10 flex gap-5 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {reviews.map((review) => {
                        return (
                            <div key={review.id} className="p-5 sm:p-6 min-w-70 md:min-w-80 lg:min-w-90 xl:min-w-100 md:p-6.5 lg:p-7 rounded-[20px] border border-[rgba(0,0,0,0.1)]">
                                <div className="flex justify-between items-center relative z-10">
                                    <StarRating averageRating={review.rating} />
                                </div>
                                <h5 className="pt-3 pb-2 md:pt-4 md:pb-3">{review.user_name}</h5>
                                <ReviewText text={review.review_text} flag={true} />
                                <p className="pt-4 md:pt-5 lg:pt-6 font-medium text-[rgba(0,0,0,0.6)]">Posted on {dayjs(review.created_at).format("MMMM D, YYYY")}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default HappyCustomers;

