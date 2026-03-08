import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";
import Brands from "../components/Brands.jsx";
import ProductsBySort from "../components/ProductsBySort.jsx";
import ProductsByCategories from "../components/ProductsByCategories.jsx";
import HappyyCustomers from "../components/HappyCustomers.jsx";

const Home = ({user, categories, brandsRef, newArrivalsRef, trendingRef, categoriesRef, reviewsRef, bannerRef, homeRef, scrollToElement}) => {

    return (
       <div ref={homeRef}> 
            <Header
                user={user}
                categories={categories}
                scrollToBrands={() => scrollToElement(brandsRef)}
                scrollToNewArrivals={() => scrollToElement(newArrivalsRef)}
                scrollToTrending={() => scrollToElement(trendingRef)}
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
