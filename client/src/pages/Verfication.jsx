import { useEffect, useState } from "react"
import { useLocation, useNavigationType } from "react-router-dom";
import { useScrollRestoration } from "../useScrollRestoration";


const Verification = () => {
    const [code, setCode] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navType = useNavigationType();
    const location = useLocation();

    useEffect(() => {
        useScrollRestoration(location, navType);
    }, []);

   const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setProcessing(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/contact/verification`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({otp: code}),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                setTimeout(() => {
                    setError("");
                }, 5000);
                return;
            }
            setMessage(data.message);
        } catch (err) {
            setError("Server error");
            setTimeout(() => {
                setError("");
            }, 5000);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="container flex justify-center items-center h-screen">
            <div className="sm:max-w-125 max-w-auto bg-[#F0F0F0] rounded-4xl overflow-hidden px-5 md:px-6 lg:px-7 py-7 md:py-10 text-black">
                <h2 className="text-center mb-4 whitespace-nowrap">Verify Your Email</h2>
                <form onSubmit={handleSubmit} className="w-full py-10">
                    <label htmlFor="otp-field" className="font-archivo font-extralight">Your otp code</label>
                    <input
                        type="number" 
                        className="w-full my-4 outline-none bg-white rounded-2xl p-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter your code"
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button disabled={processing} type="submit" className="btn-dark disabled:cursor-not-allowed">{processing? "Processing..." :"Send Code"}</button>
                </form>
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
    )
}

export default Verification;
