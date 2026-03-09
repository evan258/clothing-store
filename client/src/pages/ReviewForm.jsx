import { useState } from "react"
import { useParams } from "react-router-dom";

const ReviewForm = () => {
    const {id} = useParams();
    const [rating, setRating] = useState(1);
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const invalid = rating < 1 || rating > 5;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (invalid) {
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    product_id: id,
                    rating: Number(rating),
                    review_text: description,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                return;
            }
            setMessage("Review posted successfully");
        } catch (err) {
            setError("Server error");
            console.log(err);
        }
    }

    return (
        <div className="container flex justify-center items-center h-screen">
            <div className="sm:max-w-125 max-w-auto bg-[#F0F0F0] rounded-4xl overflow-hidden px-5 md:px-6 lg:px-7 py-7 md:py-10 text-black">
                <h2 className="text-center mb-4 whitespace-nowrap">Write a Review</h2>
                <form 
                    onSubmit={handleSubmit}
                    className="w-full py-10"
                >
                    <label className="font-archivo font-extralight" htmlFor="rating-field">Rating</label>
                    <input 
                        id="rating-field" 
                        type="number" 
                        value={rating}
                        onChange={(e) => setRating(e.target.value)} 
                        placeholder="Select a rating between 1 and 5"
                        className={`w-full my-4 outline-none bg-white rounded-2xl p-2
                            ${invalid ? "border-red-600" : "border-black"}
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`
                        }
                    />
                    {invalid && (
                        <div className="mb-4 px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                            Rating must be between 1 and 5
                        </div>
                    )}
                    <label className="font-archivo font-extralight" htmlFor="description-field">Description</label>
                    <textarea 
                        required
                        id="description-field"
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="Descrive your experience" 
                        value={description} 
                        className="w-full outline-none min-h-25 bg-white rounded-2xl p-2 resize-y my-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    />
                    <button type="submit" className="btn-dark">Submit</button>
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
                </form>
            </div>
        </div>
    )
}

export default ReviewForm;
