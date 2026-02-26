import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useEffect, useRef, useState } from "react";
import StarRating from "../components/StarRating";
import ReviewOptions from "../components/ReviewOptions";
import ReviewText from "../components/ReviewText";
import minus from "../assets/images/minus.svg";
import plus from "../assets/images/plus.svg";
import arrowLeft from "../assets/images/arrowLeft.svg";
import arrowRight from "../assets/images/arrowRight.svg";
import dayjs from "dayjs";

const ProductDetails = ({user, setUser, categories}) => {
    const { id } = useParams();
    const [productDetails, setProductDetails] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [stocks, setStocks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [option, setOption] = useState("");
    const [related, setRelated] = useState([]);
    const navigate = useNavigate(null);
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current && related.length > 0) {
            const scrollAmount = scrollRef.current.scrollWidth / related.length;
            
            scrollRef.current.scrollBy({
                left: (direction === "left") ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    }

    const reviewsPerPage = 4;
    const currentPageLastIndex = reviewsPerPage * currentPage;
    const currentPageFirstIndex = currentPageLastIndex - reviewsPerPage;
    const currentPageReviews = reviews.slice(currentPageFirstIndex, currentPageLastIndex);
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);

    const getPaginationRange = () => {
        const range = [];
        if (totalPages >= 1) range.push(1);
        if (currentPage - 2 > 1) range.push("...");
        if (currentPage - 1 > 1) range.push(currentPage - 1);
        if (currentPage !== 1) range.push(currentPage);
        if (currentPage + 1 < totalPages) range.push(currentPage + 1);
        if (currentPage + 2 < totalPages) range.push("...");
        if (totalPages !== currentPage) range.push(totalPages);
        return range;
    }
    
    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    },[currentPage]);

    useEffect(() => {
        setQuantity(1);
        setError("");
        setMessage("");
    },[selectedStock]);

    useEffect(() => {
        const fetchProductDetails = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setProductDetails(data || null);
        }
        const fetchStocks = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}/stock`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setStocks(data || []);
        }
        const fetchReviews = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}/reviews`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setReviews(data || []);
        }
        const fetchRelated = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}/related`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setRelated(data || []);
        }
        fetchProductDetails();
        fetchStocks();
        fetchReviews();
        fetchRelated();
    },[id]);

    const handleAddToCart = async () => {
        setError("");
        setMessage("");
        if (!selectedStock) {
            setError("Please select a size first");
            return;
        }
        if (selectedStock.stock < quantity) {
            setError("Not enough items available in stock");
            return;
        }
        if (quantity <= 0) {
            setError("Quantity must be at least 1");
            return;
        }
        const parsed = Number(quantity);
        if (!Number.isInteger(parsed)) {
            setError("Please enter a whole number");
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    product_id: productDetails.id,
                    size: selectedStock.size,
                    quantity: Number(quantity),
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setMessage("Item Added to the cart");
            const userRes = await fetch("http://localhost:3000/me", {
                credentials: "include",
            });
            const userData = await userRes.json();
            setUser(userData);
        } catch (err) {
            console.log(err);
            setError("Server error");
        }
    }

    useEffect(() => {
        const fetchReviewsByOption = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}/reviews?sort=${option}`);
            const data = await res.json();
                if (!res.ok) {
                    setError(data.message);
                    return;
                }
            setReviews(data || []);
        }
        fetchReviewsByOption();
    }, [option]);

    const handlePost = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        navigate(`/reviews/post/${productDetails.id}`);
    }

    return (
        <>
            <Header user={user} categories={categories} />
            <div className="container border-t border-[#F0F0F0] py-6 sm:py-10 md:py-13.5 lg:py-17.5">
                <div className="grid lg:grid-cols-[2fr_3fr] gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-10 max-w-310 mx-auto">
                    <div className="w-78 sm:w-90 md:w-100 lg:w-111">
                        <img className="w-full object-cover object-center" src={productDetails.image_url} alt="product image" />
                    </div>
                    <div>
                        <h3 className="font-archivo text-[28px] md:text-[35px] lg:text-[40px]">{productDetails.name}</h3>
                        <div className="w-full h-0.5 bg-[#F0F0F0] my-1 md:my-2 lg:my-3"></div>
                        <StarRating averageRating={parseFloat(productDetails.average_rating)} large={true} />
                        <p className="pt-1 md:pt-2 lg:pt-3">{`Rated by ${productDetails.total_reviews} people`}</p>
                        <div className="flex gap-4 items-center flex-wrap py-1 md:py-2 lg:py-3">
                            <h3>{((productDetails.price_cents - (productDetails.price_cents * productDetails.discount_percentage / 100))/100).toFixed(2)}</h3>
                            {productDetails.discount_percentage > 0 && (
                                <>
                                    <h3 className="text-[rgba(0,0,0,0.4)] line-through">{((productDetails.price_cents)/100).toFixed(2)}</h3>
                                    <button className="rounded-[62px] bg-red-200 text-red-500 py-3 px-2">
                                        {`${productDetails.discount_percentage}%`}
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="w-full h-0.5 bg-[#F0F0F0]"></div>
                        <div className="flex gap-2 sm:gap-3 items-center py-1 md:py-2 lg:py-3">
                            {stocks.map((stock) => {
                                return (
                                    <button key={stock.id} onClick={() => setSelectedStock(stock)}
                                        className={`px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-[62px] ${
                                            selectedStock?.id === stock.id ?
                                            "bg-black text-white": "bg-[#F0F0F0]"
                                        }`}
                                    >
                                        {stock.size}
                                    </button>
                                )
                            })}
                        </div>
                        <div>
                            {selectedStock ? (
                                <p>{selectedStock.stock > 0 ? 
                                    `Only ${selectedStock.stock} items left in stock` : 
                                    "Out of stock"
                                }</p>
                            ) : (
                                <p>Please select a size</p>
                            )}
                        </div>
                        <div className="w-full h-0.5 bg-[#F0F0F0] my-1 md:my-2 lg:my-3"></div>
                        <div className="flex gap-3 md:gap-4 lg:gap-5">
                            <div className="flex justify-center items-center bg-[#F0F0F0] rounded-[62px] px-4 py-3 md:px-5 md:py-4">
                                <button 
                                    onClick={() => setQuantity((prev) => Number(prev) - 1)} 
                                    className="size-5 md:size-6"
                                >
                                    <img src={minus} alt="minus" />
                                </button>
                                <input
                                    type="number"
                                    value={quantity} 
                                    onChange={(e) => setQuantity(e.target.value)} 
                                    placeholder="Quantity"
                                    className="max-w-10 sm:max-w-18 md:max-w-34 lg:max-w-38 xl:max-w-42.5 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => setQuantity((prev) => Number(prev) + 1)}
                                    className="size-5 md:size-6"
                                >
                                    <img src={plus} alt="plus" />
                                </button>
                            </div>
                            <button 
                                onClick={handleAddToCart}
                                className="bg-black text-white rounded-[62px] text-center flex-1"
                            >
                                Add to cart
                            </button>
                        </div>
                        <div className="py-1 md:py-2 lg:py-3">
                            {error && (
                                <div className="mt-4 px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                                    {error}
                                </div>
                            )}
                            {message && (
                                <div className="mt-4 px-3 py-2 bg-green-100 text-green-600 rounded-2xl">
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <h5 className="mt-12.5 md:mt-16 lg:mt-20 text-center">Ratings &amp; Reviews</h5>
                <div className="w-full h-0.5 bg-[#F0F0F0] mt-1 md:mt-2 lg:mt-3"></div>
                <div className="max-w-310 mx-auto py-5 md:py-6 flex justify-between items-center">
                    <h5>All Reviews<span className="text-gray-400 font-medium">&nbsp;{`(${reviews.length})`}</span></h5>
                    <div className="flex gap-2 md:gap-3">
                        <select onChange={(e) => setOption(e.target.value)} value={option}
                            className="bg-[#F0F0F0] text-black pl-2 py-1 md:pl-3 md:py-2 lg:pl-4 lg:py-3 rounded-[62px] outline-none"
                        >
                            <option value="latest">Latest</option>
                            <option value="highest">Highest</option>
                            <option value="lowest">Lowest</option>
                        </select>
                        <button 
                            onClick={handlePost}
                            className="bg-black text-white px-4 py-3 md:px-5 lg:py-4 lg:px-6 xl:px-7 rounded-[62px] border-none"
                        >
                            Write a Review
                        </button>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 justify-between max-w-310 mx-auto">
                    {currentPageReviews.map((review) => {
                        return (
                            <div key={review.id} className="p-5 sm:p-6 md:p-6.5 lg:p-7 rounded-[20px] border border-[rgba(0,0,0,0.1)]">
                                <div className="flex justify-between items-center relative z-10">
                                    <StarRating averageRating={review.rating} />
                                    <ReviewOptions id={id} user={user} review={review} setReviews={setReviews} setError={setError} setMessage={setMessage} />
                                </div>
                                <h5 className="pt-3 pb-2 md:pt-4 md:pb-3">{review.user_name}</h5>
                                <ReviewText text={review.review_text} />
                                <p className="pt-4 md:pt-5 lg:pt-6 font-medium text-[rgba(0,0,0,0.6)]">Posted on {dayjs(review.created_at).format("MMMM D, YYYY")}</p>
                            </div>
                        )
                    })}
                </div>
                <div className="fixed bottom-0 -translate-y-full left-0 right-0 z-50">
                    {error && (
                        <div className="min-w-75 sm:min-w-100 md:min-w-125 lg:min-w-150 text-center tracking-wide max-w-max mx-auto px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="min-w-75 sm:min-w-100 md:min-w-125 lg:min-w-150 text-center max-w-max mx-auto px-3 py-2 bg-green-100 text-green-600 rounded-2xl">
                            {message}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1 mt-12.5 md:mt-16 lg:mt-20">
                    <button 
                        onClick={() => {
                            setCurrentPage(prev => prev - 1);
                            console.log(currentPage);
                        }}
                        disabled={currentPage === 1} 
                        className="size-4 disabled:cursor-not-allowed"
                    >
                        <img src={arrowLeft} alt="previous" />
                    </button>
                    {getPaginationRange().map((page, index) => {
                        if (page === "...") {
                            return <span key={index} className="px-2 text-gray-400">...</span>
                        }
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentPage(page);
                                }}
                                className={`text-center size-6 md:size-8 rounded-2xl
                                    ${currentPage === page ? "text-white bg-black" : "text-black bg-[#F0F0F0]"}`
                                }
                            >
                                {page}
                            </button>
                        )
                    })}
                    <button 
                        onClick={() => {
                            setCurrentPage((prev) => prev + 1);
                            console.log(currentPage);
                        }}
                        disabled={currentPage === totalPages || totalPages === 0} 
                        className="size-4 disabled:cursor-not-allowed"
                    >
                        <img src={arrowRight} alt="next" />
                    </button>
                </div>
                {related.length > 0 && (
                    <div className="container pb-46 md:pb-44 lg:pb-42">
                        <h2 className="pt-10 md:pt-12 lg:pt-14 xl:pt-16 pb-8 md:pb-19 lg:pb-11 xl:pb-12 text-center">YOU MIGHT ALSO LIKE</h2>
                        <div 
                            ref={scrollRef}
                            className="flex overflow-auto gap-3 md:gap-4 lg:gap-5 max-w-310 mx-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {related.map((item) => {
                                return (
                                    <Link to={`/products/${item.id}`} key={item.id}>
                                        <div className="">
                                            <div className={`size-35 sm:size-43 md:size-50 lg:size-60 xl:size-70 bg-[#F0F0F0] 
                                                rounded-[14px] md:[rounded-16px] lg:rounded-[18px] xl:rounded-[20px]
                                                overflow-hidden`}>
                                                <img src={item.image_url} alt="product image" />
                                            </div>
                                            <h5>{item.name}</h5>
                                            <StarRating averageRating={parseFloat(item.average_rating)} />
                                            <p>{`Rated by ${item.total_reviews} people`}</p>
                                            <div className="flex gap-1 items-center flex-wrap">
                                                <h4>{((item.price_cents - (item.price_cents * item.discount_percentage / 100))/100).toFixed(2)}</h4>
                                                {item.discount_percentage > 0 && (
                                                    <>
                                                        <h4 className="text-[rgba(0,0,0,0.4)] line-through">{((item.price_cents)/100).toFixed(2)}</h4>
                                                        <button className="rounded-[62px] bg-red-200 text-red-500 py-3 px-2">
                                                            {`${item.discount_percentage}%`}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="flex gap-4 md:gap-5 lg:gap-6 justify-center pt-8 md:pt-19 lg:pt-11 xl:pt-12">
                            <button onClick={() => scroll("left")} className="size-4 md:size-4 lg:size-6">
                                <img src={arrowLeft} alt="previous" />
                            </button>
                            <button onClick={() => scroll("right")} className="size-4 md:size-4 lg:size-6">
                                <img src={arrowRight} alt="next" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default ProductDetails;
