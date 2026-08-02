import Header from "../components/Header.jsx";
import Banner from "../components/Banner.jsx";
import Brands from "../components/Brands.jsx";
import ProductsBySort from "../components/ProductsBySort.jsx";
import ProductsByCategories from "../components/ProductsByCategories.jsx";
import HappyyCustomers from "../components/HappyCustomers.jsx";
import { useLocation, useNavigationType } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
    const scrollToInitial = useRef(scrollTo);

    const isReady = loading.sortedProducts && loading.categorizedProducts && loading.reviews;
    const skipScrollRestore = scrollToInitial.current !== null;

    useEffect(() => {
      console.log("skip", skipScrollRestore);
      if (!isReady || skipScrollRestore) return;
      console.log("pass");
      useScrollRestoration(location, navType);
    }, [isReady, skipScrollRestore]);

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
