import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom";


const ReviewOptions = ({id, user, review, setReviews, setError, setMessage, flag=false}) => {
    const [optionOpen, setOptionOpen] = useState(false);
    const optionRef = useRef(null);
    const navigate = useNavigate(null);

    useEffect(() => {
        if (!optionOpen) return;
        const handleClickOutside = (e) => {
            if (optionOpen && optionRef && !optionRef.current.contains(e.target)) setOptionOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [optionOpen]);
    
    const handleEdit = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        navigate(`/reviews/put/${review.id}`);
    }

    const handleDelete = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${review.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                setTimeout(() => {
                    setError("");
                }, 5000);

                return;
            }
            const fetchReviews = async () => {
                const url = flag ? `${import.meta.env.VITE_API_URL}/users/${id}/reviews` : `${import.meta.env.VITE_API_URL}/products/${id}/reviews`;
                const res = await fetch(url);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.message);
                    setTimeout(() => {
                        setError("");
                    }, 5000);

                    return;
                }
                setReviews(data || []);
            }
            fetchReviews();
            setMessage("Review deleted successfully");
            setTimeout(() => {
                setMessage("");
            }, 5000);
        } catch (err) {
            console.log(err);
            setError("Server error");
            setTimeout(() => {
                setError("");
            }, 5000);
        }
    }

    return (
        <div ref={optionRef}>
            <span onClick={() => setOptionOpen(!optionOpen)}>...</span>
            {optionOpen && (
                <div className="absolute top-full right-0 border bg-[#F0F0F0] flex flex-col">
                    <button onClick={handleEdit} className="px-5 py-1.5 hover:bg-[#0078D7] hover:text-white w-full text-start">Edit</button>
                    <button onClick={handleDelete} className="px-5 py-1.5 hover:bg-[#0078D7] hover:text-white w-full text-start">Delete</button>
                </div>
            )}
        </div>
    )
}

export default ReviewOptions;
