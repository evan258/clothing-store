import { useParams } from "react-router-dom";
import Header from "../components/Header";
import { useEffect, useState } from "react";
import StarRating from "../components/StarRating";
import minus from "../assets/images/minus.svg";
import plus from "../assets/images/plus.svg";
import arrowLeft from "../assets/images/arrowLeft.svg";
import arrowRight from "../assets/images/arrowRight.svg";
import dayjs from "dayjs";

const ProductDetails = ({user, setUser, categories}) => {
    const { id } = useParams();
    const [productDetails, setProductDetails] = useState({});
    const [error, setError] = useState("");
    const [stocks, setStocks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);

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
    },[selectedStock]);

    useEffect(() => {
        const fetchProductDetails = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setProductDetails(data || null);
        }
        const fetchStocks = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}/stock`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setStocks(data || []);
        }
        const fetchReviews = async () => {
            const res = await fetch(`http://localhost:3000/products/${id}/reviews`);
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            setReviews(data || []);
        }
        fetchProductDetails();
        fetchStocks();
        fetchReviews();
    },[id]);

    const handleAddToCart = async () => {
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

        try {
            const res = await fetch("http://localhost:3000/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    product_id: productDetails.id,
                    size: selectedStock.size,
                    quantity: quantity,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setError("Item Added to the cart");
            const userRes = await fetch("http://localhost:3000/me", {
                credentials: "include",
            });
            const userData = await userRes.json();
            setUser(userData);
        } catch (err) {
            setError(data.error);
        }
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
                                    disabled={!selectedStock || quantity <= 1} 
                                    onClick={() => setQuantity((prev) => prev - 1)} 
                                    className="size-5 md:size-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <img src={minus} alt="minus" />
                                </button>
                                <input
                                    type="number"
                                    disabled={!selectedStock} 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(e.target.value)} 
                                    placeholder="Quantity"
                                    className="outline-none text-center disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    disabled={!selectedStock || quantity >= selectedStock.stock}
                                    onClick={() => setQuantity((prev) => prev + 1)}
                                    className="size-5 md:size-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <p className="text-red-600 font-medium">{error}</p>
                            )}
                        </div>
                    </div>
                </div>
                <h5 className="mt-12.5 md:mt-16 lg:mt-20 text-center">Ratings &amp; Reviews</h5>
                <div className="w-full h-0.5 bg-[#F0F0F0] mt-1 md:mt-2 lg:mt-3"></div>
                <div className="py-5 md:py-6 flex justify-between">

                </div>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 justify-between max-w-310 mx-auto">
                    {currentPageReviews.map((review) => {
                        return (
                            <div key={review.id} className="p-5 sm:p-6 md:p-6.5 lg:p-7 rounded-[20px] border border-[rgba(0,0,0,0.1)]">
                                <StarRating averageRating={review.rating} />
                                <h5 className="pt-3 pb-2 md:pt-4 md:pb-3">{review.user_name}</h5>
                                <p className="leading-5 text-[rgba(0,0,0,0.6)] mb-4 md:mb-5 lg:mb-6">{review.review_text}</p>
                                <p className="font-medium text-[rgba(0,0,0,0.6)]">Posted on {dayjs(review.created_at).format("MMMM D, YYYY")}</p>
                            </div>
                        )
                    })}
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
                                    console.log(currentPage);
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
                        disabled={currentPage === totalPages} 
                        className="size-4 disabled:cursor-not-allowed"
                    >
                        <img src={arrowRight} alt="next" />
                    </button>
                </div>
            </div>
        </>
    )
}

export default ProductDetails;
