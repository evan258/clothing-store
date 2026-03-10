import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import userIcon from "../assets/images/user.svg";
import arrowLeft from "../assets/images/arrowLeft.svg";
import arrowRight from "../assets/images/arrowRight.svg";
import { useNavigate, useParams } from "react-router-dom";
import StarRating from "../components/StarRating";
import ReviewOptions from "../components/ReviewOptions";
import ReviewText from "../components/ReviewText";
import Header from "../components/Header";

const Dashboard = ({setUser, user, categories, brandsRef, newArrivalsRef, trendingRef, scrollToElement}) => {
    const {id} = useParams();
    const [reviews, setReviews] = useState([]);
    const [userInfo, setUserInfo] = useState({});
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsRef = useRef(null);
    const isFirstRender = useRef(true);

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
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        reviewsRef.current.scrollIntoView({
            behavior: "instant",
            block: "center"
        });
    }, [currentPage]);

    const fetchOrderDetails = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok){
                setError(data.message);
                setTimeout(() => {
                    setError("");
                }, 5000);
                return;
            }
            setOrders(data);
        } catch (err) {
            setError("Server error");
            setTimeout(() => {
                setError("");
            }, 5000);
        }
    }

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
                    credentials: "include"
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.message);
                    setTimeout(() => {
                        setError("");
                    }, 5000);
                    return;
                }
                setUserInfo(data.user);
                setReviews(data.reviews);
            } catch (err) {
                setError("Server error");
                setTimeout(() => {
                    setError("");
                }, 5000);
            }
        }

        fetchOrderDetails();
        fetchUserDetails();
    }, []);

    const handleCancel = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok){
                setError(data.error);
                setTimeout(() => {
                    setError("");
                }, 5000);
                return;
            }
            fetchOrderDetails();
            setMessage(data.message);
            setTimeout(() => {
                setMessage("");
            }, 5000);
        } catch (err) {
            setError("Server error");
            setTimeout(() => {
                setError("");
            }, 5000);
        }
    }

    const handleLogout = async() => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {credentials:"include"});
            const data = await res.json();
            if (!res.ok){
                setError(data.error);
                setTimeout(() => {
                    setError("");
                }, 5000);
                return;
            }
            setUser(null);
            navigate('/', {replace:true});
        } catch (err) {
            setError("Server error");
            setTimeout(() => {
                setError("");
            }, 5000);
        }
    }

    return (
        <>
            <Header user={user} categories={categories} brandsRef={brandsRef} newArrivalsRef={newArrivalsRef} trendingRef={trendingRef} scrollToElement={scrollToElement} />
            <div className="border-t border-[#F0F0F0] container py-6 sm:py-10 md:py-13.5 lg:py-17.5">
                <div className="grid lg:grid-cols-[2fr_3fr] gap-5 sm:gap-6 md:gap-7 lg:gap-8 xl:gap-10 max-w-310 mx-auto items-center">
                    <div className="w-50 sm:w-60 md:w-70 lg:w-80">
                        <img className="w-full object-cover object-center" src={userIcon} alt="profile" />
                    </div>
                    <div className="flex flex-col gap-4 md:gap-5 lg:gap-6">
                        <h4>User Details</h4>
                        <div className="w-full h-px bg-[#F0F0F0]"></div>
                        {userInfo && (
                            <div className="flex flex-1 flex-col gap-3 md:gap-4 lg:gap-5">
                                <h5>Name: {userInfo.user_name}</h5>
                                <h5>Email: {userInfo.email}</h5>
                                <h5>Created At: {dayjs(userInfo.created_at).format("MMMM D, YYYY")}</h5>
                            </div>
                        )}
                        <button onClick={handleLogout} className="btn-dark max-w-75">Logout</button>
                    </div>
                </div>
                <div className="max-w-310 mx-auto my-5 md:my-6 lg:my-7 w-full h-px bg-[#F0F0F0]"></div>
                <div className="max-w-310 mx-auto px-4 py-8">
                    <h3 className="mb-6">Your Orders</h3>
                    <div className="flex flex-col gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white shadow rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="font-semibold">Order #{order.id}</p>
                                        <p className="text-sm text-gray-600">{dayjs(order.created_at).format("D MMMM, YYYY")}</p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-white text-sm ${
                                            order.status === "pending"? "bg-red-500": order.status === "paid"? "bg-green-500": "bg-yellow-500"
                                        }`}
                                    >
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="mb-4 text-sm text-gray-700">
                                    <p>
                                        <span className="font-bold">Total:</span> ${(order.total_cents / 100).toFixed(2)}
                                    </p>
                                    <p>
                                        <span className="font-bold">Phone:</span> {order.phone}
                                    </p>
                                    <p>
                                        <span className="font-bold">Address:</span> {order.shipping_address}
                                    </p>
                                    <p>
                                        <span className="font-bold">Estimated delivery:</span> {dayjs(order.created_at).add(order.estimated_days, "day").format("D MMMM, YYYY")}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 mb-4">
                                    {order.products.map((product) => (
                                        <div key={product.product_id} className="flex items-center gap-4 border-b pb-3">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="size-16 rounded-lg"
                                            />
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {product.sizes.map((s, idx) => (
                                                        <span key={idx} className="mr-3">Size {s.size}: {s.quantity}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    {order.status === "pending" ? (
                                        <>
                                            <button
                                                onClick={() => navigate(`/checkout/${order.id}/payment`)}
                                                className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-700"
                                            >
                                                Retry Payment
                                            </button>
                                            <p className="text-sm text-red-500">
                                                Pending orders will expire soon
                                            </p>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => handleCancel(order.id)}
                                            className="bg-[#F0F0F0] px-4 py-2 rounded-xl hover:bg-gray-400"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <h5 className="mt-12.5 md:mt-16 lg:mt-20 text-center">Ratings &amp; Reviews</h5>
                <div className="w-full h-0.5 bg-[#F0F0F0] mt-1 md:mt-2 lg:mt-3"></div>
                <div className="max-w-310 mx-auto py-5 md:py-6 flex justify-between items-center">
                    <h5>All Reviews<span className="text-gray-400 font-medium">&nbsp;{`(${reviews.length})`}</span></h5>
                </div>
                <div ref={reviewsRef} className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 justify-between max-w-310 mx-auto">
                    {currentPageReviews.map((review) => {
                        return (
                            <div key={review.id} className="p-5 sm:p-6 md:p-6.5 lg:p-7 rounded-[20px] border border-[rgba(0,0,0,0.1)]">
                                <div className="flex justify-between items-center relative z-10">
                                    <StarRating averageRating={review.rating} />
                                    <ReviewOptions id={id} user={user} review={review} setReviews={setReviews} setError={setError} setMessage={setMessage} flag={true} />
                                </div>
                                <h5 className="pt-3 pb-2 md:pt-4 md:pb-3">{review.user_name}</h5>
                                <ReviewText text={review.review_text} />
                                <p className="pt-4 md:pt-5 lg:pt-6 font-medium text-[rgba(0,0,0,0.6)]">Posted on {dayjs(review.created_at).format("MMMM D, YYYY")}</p>
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
                        }}
                        className={`text-center size-6 md:size-8 rounded-2xl
                                            ${currentPage === page ? "text-white bg-black" : "text-black bg-[#F0F0F0]"}`}
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
                 <div className="fixed -translate-y-[200%] top-full left-0 right-0 z-50">
                    {error && (
                        <div className="text-center tracking-wide max-w-max min-w-75 mx-auto px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="text-center max-w-max min-w-75 mx-auto px-3 py-2 bg-green-100 text-green-600 rounded-2xl">
                            {message}
                        </div>
                    )}
                    <button onClick={handleLogout} className="btn-dark max-w-75">Logout</button>
                </div>
            </div>
        </>
    )
}

export default Dashboard;
