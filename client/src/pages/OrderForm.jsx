import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom"

const OrderForm = () => {
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [formData, setFormData] = useState({phone: "", address: ""});
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const location = useLocation();
    const state = location.state;
    const navigate = useNavigate(null);

    if (!state) {
        return <Navigate to="/cart" replace state={{error: "Please proceed from the cart to checkout"}} />; // replace the url
    }

    const delivery_option_id = state.delivery_option_id;
    const total = state.total;

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => {
            return (
                {
                    ...prev,
                    [name]: value,
                }
            )
        });
    }

    const handleSubmit = async () => {
        setError("");
        setIsSubmitting(true);
        if (!formData.phone || !formData.address) {
            setError("Please fill all the fields");
            setTimeout(() => {
                setError("");
            }, 2500);
            setIsSubmitting(false);
            return;
        }
        try {
            const res = await fetch("http://localhost:3000/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    delivery_option_id,
                    shipping_address: formData.address,
                    phone: formData.phone,
                    payment_method: paymentMethod,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                setTimeout(() => {
                    setError("");
                }, 2500);
                setIsSubmitting(false);
                return;
            }
            const id = data.orderId;
            if (paymentMethod === "card") {
                navigate(`/checkout/${id}/payment`, {
                    replace: true,
                });
            } else {
                navigate("/dashboard", {
                    state: {
                        message: "Order was added successfully",
                    },
                    replace: true,
                });
            }
        } catch (err) {
            setError("Server error");
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <div className="container min-h-screen flex justify-center items-center">
            <div className="w-auto shadow sm:w-110 p-2 sm:p-3 md:p-4 lg:p-5 rounded-2xl">
                <div className="flex justify-between my-4 md:my-5 lg:my-6">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">${(total / 100).toFixed(2)}</span>
                </div>
                <h5>Payment Method</h5>
                <div className="w-full h-px bg-[#F0F0F0] my-4 md:my-5 lg:my-6"></div>
                <div className="flex flex-col gap-4 md:gap-5 lg:gap-6">
                    <label htmlFor="phone-field" className="font-medium">Phone</label>
                    <input className="p-2 rounded-2xl border outline-none" id="phone-field" type="tel" placeholder="Enter your phone" value={formData.phone} onChange={(e) => handleChange(e)} name="phone"/>
                    <label htmlFor="address-field" className="font-medium">Address</label>
                    <input className="p-2 rounded-2xl border outline-none" id="address-field" type="address" placeholder="Enter your shipping address" value={formData.address} onChange={handleChange} name="address" />
                </div>
                <div className="w-full h-px bg-[#F0F0F0] my-4 md:my-5 lg:my-6"></div>
                <div className="flex flex-col gap-4 md:gap-5 lg:gap-6">
                    <label className="flex justify-between">
                        <span className="font-medium">Cash on Delivery</span>
                        <input name="payment-method" type="radio" checked={paymentMethod === "cod"} value="cod" onChange={() => setPaymentMethod("cod")}/>
                    </label>
                    <label className="flex justify-between">
                        <span className="font-medium">Card</span>
                        <input name="payment-method" type="radio" checked={paymentMethod === "card"} value="card" onChange={() => setPaymentMethod("card")}/>
                    </label>
                </div>
                <div className="w-full h-px bg-[#F0F0F0] my-4 md:my-5 lg:my-6"></div>
                <div className="w-full flex justify-center">
                    <button disabled={isSubmitting} onClick={handleSubmit} className="btn-dark">{isSubmitting ? "Processing..." : (paymentMethod === "cod" ? "Place an Order" : "Go to Payment")}</button>
                </div>
            </div>
            <div className="fixed bottom-0 -translate-y-full left-0 right-0 z-50">
                {error && (
                    <div className="min-w-75 sm:min-w-100 md:min-w-125 lg:min-w-150 text-center tracking-wide max-w-max mx-auto px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderForm;
