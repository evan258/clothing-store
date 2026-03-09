import { useEffect, useState } from "react";
import Header from "../components/Header";
import CartItem from "../components/CartItem";
import normal from "../assets/images/normal.png";
import fast from "../assets/images/fast.png";
import superFast from "../assets/images/superFast.png";
import { useLocation } from "react-router-dom";
import OrderSummary from "../components/OrderSummary";

const Cart = ({user, setUser, categories, brandsRef, newArrivalsRef, trendingRef, scrollToElement}) => {
    const [cartItems, setCartItems] = useState([]);
    const [deliveryOptions, setDeliveryOptions] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state ?.error) {
            setError(location.state.error);
            setTimeout(() => {
                setError("");
            }, 5000);
        } else if (location.state ?.message) {
            setMessage(location.state.message);
            setTimeout(() => {
                setMessage("");
            }, 5000);
        }
        window.history.replaceState({}, document.title);
    }, [location]);

    const selectedDeliveryOption = deliveryOptions.find((opt) => opt.id === selectedDeliveryId);
    const deliveryPrice = selectedDeliveryOption? selectedDeliveryOption.price_cents : 0;
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + item.price_cents * item.quantity;
    }, 0);
    const totalDiscount = cartItems.reduce((sum, item) => {
        const discountPerItem = (item.price_cents * item.discount_percentage) / 100;
        return sum + discountPerItem * item.quantity;
    }, 0);
    const averageDiscount = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
    const total = subtotal - totalDiscount + deliveryPrice;

    const deliveryIcons = {
        "Normal": normal,
        "Fast": fast,
        "Super Fast": superFast,
    };

    useEffect(() => {
        const fetchCartDetails = async () => {
            try {
                const cartRes = await fetch(`${import.meta.env.VITE_API_URL}/cart`, {
                    credentials: "include",
                });
                const cartData = await cartRes.json();
                if (!cartRes.ok) {
                    setError(cartData.message);
                    setTimeout(() => {
                        setError("");
                    }, 5000);
                    return;
                }
                setCartItems(cartData || []);
                const qtyMap = {};
                cartData.forEach((item) => {
                    qtyMap[`${item.id}-${item.size}`] = item.quantity;
                });
                setQuantities(qtyMap);
                const deliveryOptionRes = await fetch(`${import.meta.env.VITE_API_URL}/delivery/options`);
                const deliveryOptionsData = await deliveryOptionRes.json();
                if (!deliveryOptionRes.ok) {
                    setError(deliveryOptionsData.message);
                    setTimeout(() => {
                        setError("");
                    }, 5000);
                    return;
                }
                setDeliveryOptions(deliveryOptionsData || []);
                if (deliveryOptionsData.length) {
                    setSelectedDeliveryId(deliveryOptionsData[0].id);
                }
                const userRes = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
                    credentials: "include",
                });
                const userData = await userRes.json();
                setUser(userData);
            } catch (err) {
                setError("Server error");
                setTimeout(() => {
                    setError("");
                }, 5000);
            }
        }
        fetchCartDetails();
    }, []);

    return (
        <>
            <Header user={user} categories={categories} brandsRef={brandsRef} newArrivalsRef={newArrivalsRef} trendingRef={trendingRef} scrollToElement={scrollToElement} />
            <div className="container pt-12 md:pt-14 lg:pt-16 xl:pt-17.5">
                <div className="max-w-310 mx-auto">
                    <h2 className="pb-5 md:pb-6">YOUR CART</h2>
                    <div className="grid grid-cols-3 gap-4 md:gap-5">
                        <div className="max-h-max col-span-3 lg:col-span-2 flex flex-col gap-4 md:gap-5 lg:gap-6 rounded-[20px] border border-[#F0F0F0] p-3 lg:px-6 lg:py-5 md:px-5 md:py-4">
                            {cartItems.map((item, index) => {
                                return (
                                    <CartItem key={`${item.id}-${item.size}`} quantities={quantities} setQuantities={setQuantities} setCartItems={setCartItems} item={item} index={index} cartItems={cartItems} />
                                )
                            })}
                        </div>
                        {cartItems.length > 0 && (
                            <div className="col-span-3 lg:col-span-1 w-full max-h-max flex flex-col md:flex-row lg:flex-col gap-4 md:gap-5">
                                <div className="flex flex-1 flex-col gap-4 md:gap-5 rounded-[20px] border border-[#F0F0F0] p-3 lg:px-6 lg:py-5 md:px-5 md:py-4">
                                    <h4 className="border-b border-[#F0F0F0] pb-4 md:pb-5 lg:pb-6">Delivery Options</h4>
                                    {deliveryOptions.map((option, index) => {
                                        return (
                                            <label key={option.id} 
                                                className={`cursor-pointer ${index !== deliveryOptions.length - 1 ? "border-b border-[#F0F0F0] pb-4 md:pb-5 lg:pb-6" : ""}`}
                                            >
                                                <div className="flex item-center gap-2 md:gap-3">
                                                    <div className="size-8 md:size-10 lg:size-12">
                                                        <img src={deliveryIcons[option.name]} alt="delivery image" />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between gap-2 md:gap-3">
                                                            <h5>{option.name}</h5>
                                                            <h5>${(option.price_cents / 100).toFixed(2)}</h5>
                                                            <input
                                                                type="radio"
                                                                name="delivery"
                                                                checked={selectedDeliveryId === option.id}
                                                                onChange={() => setSelectedDeliveryId(option.id)} 
                                                                className="accent-black"
                                                            />
                                                        </div>
                                                        <p>Estimated delivery in {option.estimated_days} days</p>
                                                    </div>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                                <OrderSummary subtotal={subtotal} averageDiscount={averageDiscount} totalDiscount={totalDiscount} deliveryPrice={deliveryPrice} total={total} selectedDeliveryId={selectedDeliveryId} />
                            </div>
                        )}
                    </div>
                    <div className="fixed bottom-0 -translate-y-full left-0 right-0 z-50">
                        {error && (
                            <div className="min-w-75 sm:min-w-100 md:min-w-125 lg:min-w-150 text-center tracking-wide max-w-max mx-auto px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="min-w-75 sm:min-w-100 md:min-w-125 lg:min-w-150 text-center tracking-wide max-w-max mx-auto px-3 py-2 bg-green-100 text-green-600 rounded-2xl">
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Cart;
