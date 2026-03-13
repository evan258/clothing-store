import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import StarRating from "./StarRating";


const ProductsBySort = ({newArrivalsRef, trendingRef, onLoad}) => {
    const [latest, setLatest] = useState([]);
    const [trending, setTrending] = useState([]);
    const [itemsPerRow, setItemsPerRow] = useState(2);
    const [showAllLatest, setShowAllLatest] = useState(false);
    const [showAllTrending, setShowAllTrending] = useState(false);

    useEffect(() => {
        const updateItemsPerRow = () => {
            if (window.innerWidth >= 1024) {
                setItemsPerRow(4);
            } else if (window.innerWidth >= 768) {
                setItemsPerRow(3);
            } else {
                setItemsPerRow(2);
            }
        }

        updateItemsPerRow();
        window.addEventListener('resize', updateItemsPerRow);
        return () => window.removeEventListener('resize', updateItemsPerRow);
    }, []);

    const visibleLatest = showAllLatest ? latest : latest.slice(0, itemsPerRow);
    const visibleTrending = showAllTrending ? trending : trending.slice(0, itemsPerRow);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/products/latest`);
                const data = await res.json();
                if (!res.ok) {
                    console.log(data.error);
                   return;
                }
                setLatest(data || []);
            } catch (err) {
                console.log(err);
            }
        }

        const fetchTrending = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/products/trending`);
                const data = await res.json();
                if (!res.ok) {
                    console.log(data.error);
                    return;
                }
                setTrending(data || []);
            } catch (err) {
                console.log(err);
            }
        }
        const fetchData = async () => {
            try {
                await Promise.all([fetchLatest(), fetchTrending()]);
            } catch (err) {
                console.log(err);
            } finally {
                onLoad();
            }
        }
        fetchData();
    }, []);

    return (
        <div className="container pt-12.5 md:pt-15 lg:pt-17 xl:pt-20">
            <div className="max-w-310 mx-auto">
                <h2 ref={newArrivalsRef} className="text-center">NEW ARRIVALS</h2>
                <div className="pt-8 md:pt-10 lg:pt-12 xl:pt-14 pb-6 md:pb-7 lg:pb-8 xl:pb-9 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
                    {visibleLatest.map((item) => {
                        return (
                            <Link to={`/products/${item.id}`} key={item.id}>
                                <div className="flex flex-col gap-1 md:gap-1.25 lg:gap-1.5">
                                    <div className={`size-35 sm:size-43 md:size-50 lg:size-60 xl:size-70 bg-[#F0F0F0] 
                                        rounded-[14px] md:[rounded-16px] lg:rounded-[18px] xl:rounded-[20px]
                                        overflow-hidden`}>
                                        <img className="h-full w-full object-cover" src={item.image_url} alt="product image" />
                                    </div>
                                    <h5>{item.name}</h5>
                                    <StarRating averageRating={parseFloat(item.average_rating)} />
                                    <p className="pt-1 md:pt.1.5 lg:pt-2">{`Rated by ${item.total_reviews} people`}</p>
                                    <div className="flex gap-1 md:gap-2 lg:gap-3 items-center flex-wrap">
                                        <h4>{((item.price_cents - (item.price_cents * item.discount_percentage / 100))/100).toFixed(2)}</h4>
                                        {item.discount_percentage > 0 && (
                                            <>
                                                <h4 className="text-[rgba(0,0,0,0.4)] line-through">{((item.price_cents)/100).toFixed(2)}</h4>
                                                <button className="rounded-[62px] bg-red-200 text-red-500 py-2 px-2">
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
                {latest.length > itemsPerRow && (
                    <div className="text-center">
                        <button 
                            onClick={() => setShowAllLatest(!showAllLatest)}
                            className="btn-dark bg-white border text-black mb-10 md:mb-12 lg:mb-14 xl:mb-16 hover:bg-black hover:text-white transition-colors duration-300"
                        >
                            {showAllLatest ? "View Less" : "View All"}
                        </button>
                    </div>
                )}
                <div className="h-px w-full bg-[#F0F0F0] mb-12.5 md:mb-15 lg:mb-17 xl:mb-20"></div>
                <h2 ref={trendingRef} className="text-center">TOP SELLING</h2>
                <div className="pt-8 md:pt-10 lg:pt-12 xl:pt-14 pb-6 md:pb-7 lg:pb-8 xl:pb-9 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
                    {visibleTrending.map((item) => {
                        return (
                            <Link to={`/products/${item.id}`} key={item.id}>
                                <div className="flex flex-col gap-1 md:gap-1.25 lg:gap-1.5">
                                    <div className={`size-35 sm:size-43 md:size-50 lg:size-60 xl:size-70 bg-[#F0F0F0] 
                                        rounded-[14px] md:[rounded-16px] lg:rounded-[18px] xl:rounded-[20px]
                                        overflow-hidden`}>
                                        <img className="h-full w-full object-cover" src={item.image_url} alt="product image" />
                                    </div>
                                    <h5>{item.name}</h5>
                                    <StarRating averageRating={parseFloat(item.average_rating)} />
                                    <p className="pt-1 md:pt-1.5 lg:pt-2">{`Rated by ${item.total_reviews} people`}</p>
                                    <div className="flex gap-1 md:gap-2 lg:gap-3 items-center flex-wrap">
                                        <h4>{((item.price_cents - (item.price_cents * item.discount_percentage / 100))/100).toFixed(2)}</h4>
                                        {item.discount_percentage > 0 && (
                                            <>
                                                <h4 className="text-[rgba(0,0,0,0.4)] line-through">{((item.price_cents)/100).toFixed(2)}</h4>
                                                <button className="rounded-[62px] bg-red-200 text-red-500 py-2 px-2">
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
                {trending.length > itemsPerRow && (
                    <div className="text-center">
                        <button 
                            onClick={() => setShowAllTrending(!showAllTrending)}
                            className="btn-dark bg-white border text-black mb-10 md:mb-12 lg:mb-14 xl:mb-16 hover:bg-black hover:text-white transition-colors duration-300"
                        >
                            {showAllTrending ? "View Less" : "View All"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProductsBySort;
