import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


const ProductsByCategories = () => {
    const [categories, setCategories] = useState([]);
   
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
                const data = await res.json();
                if (!res.ok) {
                    console.log(data.error);
                    return;
                }
                setCategories(data || []);
            } catch (err) {
                console.log(err);
            }
        }
        fetchCategories();
    }, []);

    return (
        <div className="container pt-12.5 md:pt-15 lg:pt-18 xl:pt-20 min-h-203.75 sm:min-h-375 md:min-h-153 lg:min-h-193 xl:min-h-237.5">
            <div className="max-w-310 mx-auto bg-[#F0F0F0] rounded-[20px]">
                <h2 className="text-center pt-10 md:pt-13 lg:pt-15 xl:pt-17.5">BROWSE BY DRESS STYLE</h2>
                <div className="grid grid-cols-3 gap-3 md:gap-4 lg:gap-5 p-6 pt-7 md:p-9 lg:p-13 xl:pt-16">
                    {categories.map((category, index) => {
                        return(
                            <Link to={`/products/categories/${category.id}`} key={category.id} className={`bg-white rounded-[20px] overflow-hidden relative col-span-3 ${(index === 0 || index === categories.length - 1) ? "md:col-span-1" : "md:col-span-2"}`}>
                                <img className="w-full h-full object-cover object-right" src={category.image_url} alt={category.name} />
                                <div className="absolute top-[10%] left-[10%]">
                                    <h4>{category.name}</h4>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ProductsByCategories;
