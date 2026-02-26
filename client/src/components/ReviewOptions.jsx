import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom";


const ReviewOptions = ({id, user, review, setReviews, setError, setMessage}) => {
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
            const res = await fetch(`http://localhost:3000/reviews/${review.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                setTimeout(() => {
                    setError("");
                }, 1500);

                return;
            }
            const fetchReviews = async () => {
                const res = await fetch(`http://localhost:3000/products/${id}/reviews`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.message);
                    setTimeout(() => {
                        setError("");
                    }, 1500);

                    return;
                }
                setReviews(data || []);
            }
            fetchReviews();
            setMessage("Review deleted successfully");
            setTimeout(() => {
                setMessage("");
            }, 1500);
        } catch (err) {
            console.log(err);
            setError("Server error");
            setTimeout(() => {
                setError("");
            }, 1500);
        }
    }

    return (
        <div ref={optionRef}>
            <span onClick={() => setOptionOpen(!optionOpen)}>...</span>
            {optionOpen && (
                <div className="absolute top-full right-0 border bg-[#F0F0F0] flex flex-col">
                    <button onClick={handleEdit} className="px-5 py-1.5 hover:bg-blue-600 hover:text-white w-full text-start">Edit</button>
                    <button onClick={handleDelete} className="px-5 py-1.5 hover:bg-blue-600 hover:text-white w-full text-start">Delete</button>
                </div>
            )}
        </div>
    )
}

export default ReviewOptions;
