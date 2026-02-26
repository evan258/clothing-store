import { useEffect, useState } from "react";
import search from "../assets/images/search.svg";
import { enablePageScroll, disablePageScroll } from "scroll-lock";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import X from "../assets/images/X.svg";

const Search = ({inputRef}) => {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [suggessions, setSuggessions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(timerId);
    },[query]);

    const useDebounce = async () => {
        if (debouncedQuery.trim() === "") {
            setSuggessions([]);
            return;
        }
        try {
            const res = await fetch(`http://localhost:3000/products/search?q=${debouncedQuery}`);
            const data = await res.json();
            setSuggessions(data || []);
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        useDebounce();
    },[debouncedQuery]);

    useEffect(() => {
        if (suggessions.length > 0) {
            disablePageScroll();
        } else {
            enablePageScroll();
        }
    },[suggessions]);

    const handleClear = () => {
        setQuery("");
        setSuggessions([]);
    }

    useEffect(() => {
        if (inputRef && inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className="bg-[#F0F0F0] rounded-[62px] overflow-hidden w-full flex items-center gap-3 py-3 px-4">
            <img className="size-5" src={search} alt="search" />
            <input 
                ref={inputRef}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onChange={(e) => setQuery(e.target.value)} 
                value={query} 
                className="flex-1 outline-none" type="text" placeholder="Search products" 
            />
            {isFocused && query.length > 0 && (
                <button onClick={handleClear} className="size-5">
                    <img src={X} alt="X" />
                </button>
            )}
            {suggessions.length > 0 && (
                <div className="fixed top-28 md:top-31 lg:top-24 left-0 right-0 bottom-0 bg-white z-10 overflow-y-scroll">
                    <div className="container border-t border-[#F0F0F0]">
                        <div className={`max-w-max mx-auto grid grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4 lg:gap-5 
                        py-6 sm:py-10 md:py-13.5 lg:py-17.5 `}>
                            {suggessions.map((item) => {
                                return (
                                    <Link onClick={handleClear} to={`/products/${item.id}`} key={item.id}>
                                        <div className="">
                                            <div className={`size-35 sm:size-43 md:size-50 lg:size-60 xl:size-70 bg-[#F0F0F0] 
                                                rounded-[14px] md:[rounded-16px] lg:rounded-[18px] xl:rounded-[20px]
                                                overflow-hidden`}>
                                                <img src={item.image_url} alt="product image" />
                                            </div>
                                            <h5>{item.name}</h5>
                                            <StarRating averageRating={parseFloat(item.average_rating)} />
                                            <p>{`Rated by ${item.total_reviews} people`}</p>
                                            <div className="flex gap-1 items-center flex-wrap">
                                                <h4>{((item.price_cents - (item.price_cents * item.discount_percentage / 100))/100).toFixed(2)}</h4>
                                                {item.discount_percentage > 0 && (
                                                    <>
                                                        <h4 className="text-[rgba(0,0,0,0.4)] line-through">{((item.price_cents)/100).toFixed(2)}</h4>
                                                        <button className="rounded-[62px] bg-red-200 text-red-500 py-3 px-2">
                                                            {`${item.discount_percentage}%`}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Search;
