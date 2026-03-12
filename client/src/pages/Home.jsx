import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";
import Brands from "../components/Brands.jsx";
import ProductsBySort from "../components/ProductsBySort.jsx";
import ProductsByCategories from "../components/ProductsByCategories.jsx";
import HappyyCustomers from "../components/HappyCustomers.jsx";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const Home = ({user, categories, brandsRef, newArrivalsRef, trendingRef, categoriesRef, reviewsRef, bannerRef, homeRef, scrollToElement}) => {
    const location = useLocation();

    useEffect(() => {
        requestAnimationFrame(() => {
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
        });
    }, [location]);

    return (
       <div
            ref={homeRef}
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
            <ProductsBySort newArrivalsRef={newArrivalsRef} trendingRef={trendingRef} />
            <div ref={categoriesRef}>
                <ProductsByCategories />
            </div>
            <div ref={reviewsRef}>
                <HappyyCustomers />
            </div>
        </div>
    );
}

export default Home;
