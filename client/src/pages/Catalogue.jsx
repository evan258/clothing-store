import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import StarRating from "../components/StarRating";
import filter from "../assets/images/filter.svg";
import { enablePageScroll, disablePageScroll } from "@fluejs/noscroll";

const Catalogue = ({user, categories}) => {
    const {id} = useParams();
    const [products, setProducts] = useState([]);
    const [searchParams] = useSearchParams();
    const option = searchParams.get("sort") || "popularity_highest";
    const navigate = useNavigate();
    const filterRef = useRef(null);
    const [sidebar, setSidebar] = useState(false);
    
    const [pendingCategoryId, setPendingCategoryId] = useState(id);
    const [pendingOption, setPendingOption] = useState(option);

    useEffect(() => {
        if (sidebar) {
            disablePageScroll();
        } else {
            enablePageScroll();
        }
    }, [sidebar]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`http://localhost:3000/products/categories/${id}?sort=${option}`);
                const data = await res.json();
                if (!res.ok) {
                    console.log(data.error);
                    return;
                }
                setProducts(data || []);
            } catch (err) {
                console.log(err);
            }
        }

        fetchProducts();
    }, [id, option]);

    const handleApply = () => {
        navigate(`/products/categories/${pendingCategoryId}?sort=${pendingOption}`);
        setSidebar(false);
    }

    useEffect(() => {
        if (pendingCategoryId == id && pendingOption === option) return;
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setPendingCategoryId(id);
                setPendingOption(option);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [pendingCategoryId, pendingOption]);

    useEffect(() => {
        if (!sidebar) return;
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setSidebar(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebar]);

    return (
        <>
            <Header user={user} categories={categories} />
            <div className="container border-t border-[#F0F0F0]">
                <div className="max-w-max mx-auto grid gap-5 lg:grid-cols-[1fr_4fr] items-start pt-6 sm:pt-10 md:pt-13.5 lg:pt-17.5">
                    <div className={`${sidebar? "translate-x-0": "-translate-x-full lg:translate-x-0"} transition-transform duration-500 lg:flex lg:static bg-transparent fixed top-25 sm:top-28 md:top-31 left-0 right-0 bottom-0 z-10`}>
                        <div ref={filterRef} className="bg-white border border-[#F0F0F0] rounded-[20px] px-5 py-4 max-sm:w-64 max-md:w-74 max-lg:w-84 max-lg:overflow-y-auto h-full">
                            <div className="flex justify-between items-center">
                                <h4>Filter</h4>
                                <img src={filter} alt="filter" />
                            </div>
                            <div className="h-px w-full bg-[#F0F0F0] my-6"></div>
                            <h5 className="pb-5">Dress Style</h5>
                            <div className="flex flex-col gap-5">
                                {categories?.length > 0 && categories.map((cat) => (
                                    <span 
                                        key={cat.id}
                                        onClick={() => setPendingCategoryId(cat.id)}
                                        className={`${Number(pendingCategoryId) === cat.id ? "text-black underline font-medium" : "text-gray-500 hover:text-black"}`}
                                    >
                                        {cat.name}
                                    </span>
                                ))}
                            </div>
                            <div className="h-px w-full bg-[#F0F0F0] my-6"></div>
                            <div className="flex flex-col gap-5">
                                <h5>Sort By</h5>
                                <span onClick={() => setPendingOption("popularity_highest")} className={`${pendingOption === "popularity_highest" ? "text-black underline font-medium" : "text-gray-500 hover:text-black"}`}>Total sold highest</span>
                                <span onClick={() => setPendingOption("popularity_lowest")} className={`${pendingOption === "popularity_lowest" ? "text-black underline font-medium" : "text-gray-500 hover:text-black"}`}>Total sold lowest</span>
                                <span onClick={() => setPendingOption("price_highest")} className={`${pendingOption === "price_highest" ? "text-black underline font-medium" : "text-gray-500 hover:text-black"}`}>Price highest</span>
                                <span onClick={() => setPendingOption("price_lowest")} className={`${pendingOption === "price_lowest" ? "text-black underline font-medium" : "text-gray-500 hover:text-black"}`}>Price lowest</span>
                            </div>
                            <div className="text-center">
                                <button onClick={handleApply} className="btn-dark my-5">Apply</button>
                            </div>
                        </div>
                    </div>
                    <div className="max-lg:flex flex-col">
                        <button onClick={() => setSidebar(!sidebar)} className="lg:hidden self-end size-8 p-2 bg-[#F0F0F0] rounded-[62px] overflow-hidden mb-5">
                            <img src={filter} alt="filter" className="w-full h-full" />
                        </button>
                        <div className="max-w-max mx-auto grid grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-4 lg:gap-5">
                            {products.map((item) => {
                                return (
                                    <Link to={`/products/${item.id}`} key={item.id}>
                                        <div className="">
                                            <div className={`size-35 sm:size-43 md:size-50 lg:size-58 xl:size-70 bg-[#F0F0F0] 
                                                rounded-[14px] md:[rounded-16px] lg:rounded-[18px] xl:rounded-[20px]
                                                overflow-hidden`}>
                                                <img src={item.image_url} alt="product image" />
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
                                            <span>{item.total_sold} pieces sold total</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>        
        </>
    )
}

export default Catalogue;
