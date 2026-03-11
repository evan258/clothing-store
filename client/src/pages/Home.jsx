import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";
import Brands from "../components/Brands.jsx";
import ProductsBySort from "../components/ProductsBySort.jsx";
import ProductsByCategories from "../components/ProductsByCategories.jsx";
import HappyyCustomers from "../components/HappyCustomers.jsx";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../components/Footer.jsx";

const Home = ({user, categories, brandsRef, newArrivalsRef, trendingRef, categoriesRef, reviewsRef, bannerRef, homeRef, scrollToElement, scrollToTop}) => {
    const location = useLocation();
    const [isLoaded, setIsLoaded] = useState({
        productsSort: false,
        productsCategories: false,
        reviews: false,
    });

    const isReady = isLoaded.productsSort && isLoaded.productsCategories && isLoaded.reviews;

    useEffect(() => {
        if (location.state?.scrollTo) {
            let ref;
            if (location.state.scrollTo === "banner") ref = bannerRef;
            else if (location.state.scrollTo === "reviews") ref = reviewsRef;
            else if (location.state.scrollTo === "brands") ref = brandsRef;
            else if (location.state.scrollTo === "newArrivals") ref = newArrivalsRef;
            else if (location.state.scrollTo === "trending") ref = trendingRef;
            if (ref?.current) {
                scrollToElement(ref);
            }
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    return (
       <div
            ref={homeRef}
            className={!isReady ? "max-[400px]:min-h-1110 max-sm:min-h-1175 max-[680px]:min-h-1250 max-md:min-h-1300 max-lg:min-h-1087.5 max-xl:min-h-1025 max-2xl:min-h-1125" : ""}
        > 
            <Header
                user={user}
                categories={categories}
                brandsRef={brandsRef}
                newArrivalsRef={newArrivalsRef}
                trendingRef={trendingRef}
                scrollToElement={scrollToElement}
            />
            <div ref={bannerRef}>
                <Banner
                    scrollToCategories={() => scrollToElement(categoriesRef)}
                />
            </div>
            <div ref={brandsRef}>
                <Brands />
            </div>
            <ProductsBySort newArrivalsRef={newArrivalsRef} trendingRef={trendingRef} onLoad = {() => setIsLoaded(prev => ({...prev, productsSort: true}))} />
            <div ref={categoriesRef}>
                <ProductsByCategories onLoad = {() => setIsLoaded(prev => ({...prev, productsCategories: true}))} />
            </div>
            <div ref={reviewsRef}>
                <HappyyCustomers onLoad = {() => setIsLoaded(prev => ({...prev, reviews: true}))} />
            </div>
            <Footer
                user={user}
                brandsRef={brandsRef}
                reviewsRef={reviewsRef}
                bannerRef={bannerRef}
                scrollToElement={scrollToElement}
                scrollToTop={scrollToTop}
            />
        </div>
    );
}

export default Home;
