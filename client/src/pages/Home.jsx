import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";
import Brands from "../components/Brands.jsx";
import ProductsBySort from "../components/ProductsBySort.jsx";
import ProductsByCategories from "../components/ProductsByCategories.jsx";
import HappyyCustomers from "../components/HappyCustomers.jsx";
import { useLocation, useNavigationType } from "react-router-dom";
import { useEffect, useState } from "react";
import { useScrollRestoration } from "../useScrollRestoration.js";
import Loading from "../components/Loading.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setScrollTo } from "../state/slice.js";

const Home = ({user, categories}) => {
    const location = useLocation();
    const navType = useNavigationType();
    const [loading, setLoading] = useState({
        sortedProducts: false,
        categorizedProducts: false,
        reviews: false
    });
    const scrollTo = useSelector((state) => state.scroll.scrollTo);

    const isReady = loading.sortedProducts && loading.categorizedProducts && loading.reviews;
    const skipScrollRestore = scrollTo !== null;

    useEffect(() => {
      console.log(scrollTo);
      if (!isReady || skipScrollRestore) return;
      useScrollRestoration(location, navType);
    }, [isReady]);

    return (
       <div> 
            <Header
                user={user}
                categories={categories}
            />
            <div>
                <Banner />
            </div>
            <div>
                <Brands />
            </div>
            <ProductsBySort onLoad={() => setLoading(prev => ({...prev, sortedProducts: true}))} />
            <div>
                <ProductsByCategories onLoad={() => setLoading(prev => ({...prev, categorizedProducts: true}))} />
            </div>
            <div>
                <HappyyCustomers onLoad={() => setLoading(prev => ({...prev, reviews: true}))} />
            </div>
            {!isReady && (
              <Loading />
            )}
        </div>
    );
}

export default Home;
