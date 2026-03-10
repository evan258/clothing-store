import { useEffect, useRef, useState } from "react";
import deleteBtn from "../assets/images/deleteBtn.png";
import plus from "../assets/images/plus.svg";
import minus from "../assets/images/minus.svg";
import { Link } from "react-router-dom";

const CartItem = ({setUser, quantities, setQuantities, setCartItems, item, index, cartItems}) => {
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const alertRef = useRef(null);

    const handleSubmit = async (product_id, size, quantity) => {
        setError("");
        setMessage("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/cart`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({product_id, size, quantity}),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setCartItems(data || []);
            setUser(prev => ({...prev, cart_count: data.length}));
            setMessage("Cart updated successfully");
        } catch (err) {
            setError("Server error");
        }
    }

    useEffect(() => {
        if (error === "" && message === "") return;
        const handleClickOutside = (e) => {
            if (alertRef.current && !alertRef.current.contains(e.target)) {
                setError("");
                setMessage("");
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [error, message]);


    return (
        <div
            className={`flex gap-2 md:gap-3 relative
                ${index !== cartItems.length - 1 ? "border-b border-[#F0F0F0] pb-4 md:pb-5 lg:pb-6" : ""}`}
        >
            <div className="size-25 md:size-28 lg:size-31 rounded-lg overflow-hidden">
                <img className="cover" src={item.image_url} alt="product image" />
            </div>
            <div className="flex flex-1 flex-col justify-between">
            <Link to={`/products/${item.id}`}>
                <h5 className="max-sm:text-[14px]">{item.name}</h5>
            </Link>
                <span>Size: {item.size}</span>
                <div className="flex gap-y-px gap-x-2 md:gap-x-3 flex-wrap">
                    <h4 className="max-sm:text-[16px]">${((item.price_cents - (item.price_cents * item.discount_percentage / 100)) / 100).toFixed(2)}</h4>
                    <h4 className="max-sm:text-[16px] text-gray-300 line-through">${(item.price_cents / 100).toFixed(2)}</h4>
                    {item.discount_percentage > 0 && (
                        <span className="max-sm:p-1 p-2 text-center bg-red-100 text-red-600 rounded-2xl">{item.discount_percentage}%</span>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-end justify-between">
                <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
                    <button 
                        onClick={() => {
                            setError("");
                            setMessage("");
                            const key = `${item.id}-${item.size}`;
                            const value = quantities[key];
                            if (value === item.quantity) {
                                setError("Your cart is already up to date");
                                return;
                            }
                            if (value === "") {
                                setError("Invalid quantity");
                                return;
                            }
                            const parsed = Number(value);
                            if (!Number.isInteger(parsed)) {
                                setError("Please enter a whole number");
                                return;
                            }
                            if (parsed < 1) {
                                setError("Quantity must be at least 1");
                                return;
                            }
                            if (parsed > item.stock) {
                                setError(`Only ${item.stock} items left in stock`);
                                return;
                            }
                            handleSubmit(item.id, item.size, parsed);
                        }}
                        className="rounded-[62px] bg-black text-white font-medium py-2 px-3 md:py-3 md:px-4 disabled:cursor-not-allowed"
                    >
                            Save
                    </button>
                    <button onClick={() => handleSubmit(item.id, item.size, 0)}>
                        <img className="size-4 lg:size-5" src={deleteBtn} alt="delete" />
                    </button>
                </div>
                <div className="flex bg-[#F0F0F0] items-center rounded-2xl">
                    <button 
                        onClick={() => {
                            setError("");
                            setMessage("");
                            const key = `${item.id}-${item.size}`;
                            const current = Number(quantities[key]);
                            setQuantities(prev => ({
                                ...prev,
                                [key]: current - 1,
                            }));
                        }}
                        className="py-2 px-3 md:py-3 md:px-4"
                    >
                        <img className="min-h-3 min-w-3 size-3 md:size-4" src={minus} alt="minus" />
                    </button>
                    <input 
                        type="number" 
                        value={quantities[`${item.id}-${item.size}`] ?? ""}
                        onChange={(e) => {
                            setError("");
                            setMessage("");
                            const key = `${item.id}-${item.size}`;
                            const value = e.target.value;
                            setQuantities((prev) => {
                                return ({
                                    ...prev,
                                    [key]: value,
                                })
                            });
                        }}
                        
                        placeholder="Quantity" 
                        className="text-center max-w-4 sm:max-w-15 md:max-w-20 lg:max-w-25 xl:max-w-20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                    <button 
                        onClick={() => {
                            setError("");
                            setMessage("");
                            const key = `${item.id}-${item.size}`;
                            const current = Number(quantities[key]);
                            setQuantities(prev => ({
                                ...prev,
                                [key]: current + 1,
                            }));
                        }}
                        className="py-2 px-3 md:py-3 md:px-4"
                    >
                        <img className="min-h-3 min-w-3 size-3 md:size-4" src={plus} alt="plus" />
                    </button>
                </div>
            </div>
            <div ref={alertRef} className="absolute top-full left-0 right-0 z-50">
                {error && (
                    <div className="text-center tracking-wide max-w-max mx-auto px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="text-center max-w-max mx-auto px-3 py-2 bg-green-100 text-green-600 rounded-2xl">
                        {message}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CartItem;
