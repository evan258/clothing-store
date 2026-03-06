import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";
import Brands from "../components/Brands.jsx";
import ProductsBySort from "../components/ProductsBySort.jsx";
import ProductsByCategories from "../components/ProductsByCategories.jsx";
import HappyyCustomers from "../components/HappyCustomers.jsx";
import { useEffect, useRef } from "react";

const Home = ({user, categories}) => {
    const brandsRef = useRef(null);
    const newArrivalsRef = useRef(null);
    const trendingRef = useRef(null);
    const categoriesRef = useRef(null);

    useEffect(() => {
        window.scrollTo({
            top: 0,
        });
    }, []);

    const scrollToElement = (element) => {
        if (element.current) {
            element.current.scrollIntoView({
                behavior: "smooth",
                block: `${element === brandsRef? "center": "start"}`
            });
        }
    }

    return (
       <div> 
            <Header
                user={user}
                categories={categories}
                scrollToBrands={() => scrollToElement(brandsRef)}
                scrollToNewArrivals={() => scrollToElement(newArrivalsRef)}
                scrollToTrending={() => scrollToElement(trendingRef)}
            />
            <Banner
                scrollToCategories={() => scrollToElement(categoriesRef)}
            />
            <div ref={brandsRef}>
                <Brands />
            </div>
            <ProductsBySort newArrivalsRef={newArrivalsRef} trendingRef={trendingRef} />
            <div ref={categoriesRef}>
                <ProductsByCategories />
            </div>
            <HappyyCustomers />
        </div>
    );
}

export default Home;
