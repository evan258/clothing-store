import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


const CheckoutForm = ({orderId}) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCancel = async () => {
        setIsProcessing(true);
        setErrorMessage("");
        try {
            const res = await fetch(`http://localhost:3000/cancel/${orderId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.error);
                setTimeout(() => {
                    setErrorMessage("");
                }, 1500);
                setIsProcessing(false);
                return;
            }
            setTimeout(() => {
                setIsProcessing(false);
                navigate("/cart", {
                    state: {
                        message: "Order was canceled successfully",
                    },
                    replace: true,
                });
            }, 3000);
        } catch (err) {
            setError("Server error");
            setIsProcessing(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) {
            setErrorMessage("Something went wrong, please try again");
            setTimeout(() => {
                setErrorMessage("");
            }, 1500);
            return;
        }
        setIsProcessing(true);
        const {error} = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/dashboard?order_success=true`,
            },
        });
        if (error) {
            setErrorMessage(error.message);
            setTimeout(() => {
                setErrorMessage("");
            }, 1500);
        }
        setIsProcessing(false);
    }

    return (
        <div className="container min-h-screen flex justify-center items-center">
            <form onSubmit={handleSubmit} className="w-auto sm:w-110 p-2 sm:p-3 md:p-4 lg:p-5 shadow">
                <h4 className="my-4 md:my-5 lg:my-6">Complete Payment</h4>
                <PaymentElement />
                {errorMessage && (
                    <span className="text-red-500 my-4 md:my-5 lg:my-6">{errorMessage}</span>
                )}
                <div className="flex gap-2 md:gap-3 my-4 md:my-5 lg:my-6">
                    <button 
                        type="submit"
                        disabled={isProcessing || !stripe || !elements}
                        className="btn-dark disabled:cursor-not-allowed"
                    >
                    {isProcessing ? "Processing..." : "Pay now"}
                    </button>
                    <button disabled={isProcessing || !stripe || !elements} className="btn-dark" type="button disabled:cursor-not-allowed" onClick={handleCancel}>{isProcessing ? "Processing" : "Cancel"}</button>
                </div>
            </form>
        </div>
    )
}

export default CheckoutForm;
