import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react"
import { useNavigationType, useParams } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm";
import { useScrollRestoration } from "../useScrollRestoration";


const CheckoutWrapper = ({user}) => {
    const {id} = useParams();
    const [clientSecret, setClientSecret] = useState("");
    const [error, setError] = useState("");
    const location = useNavigationType();
    const navType = useNavigationType();

    const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/checkout/${id}`, {
                    credentials: 'include',
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.message);
                    return;
                }
                setClientSecret(data.clientSecret);
            } catch (err) {
                setError("Server error");
            } finally {
                useScrollRestoration(location, navType);
            }
        }
        fetchClientSecret();
    }, [id]);

    return (
        <div className="container text-center">
            {error ? (
                <h4>{error}</h4>
            ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{clientSecret}}>
                    <CheckoutForm user={user} orderId={id} />
                </Elements>
            ) : (
                <h4>Loading...</h4>
            )}
        </div>
    )
}

export default CheckoutWrapper;
