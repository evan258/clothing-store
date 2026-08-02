import ck from "../assets/images/ck.png";
import versace from "../assets/images/versace.png";
import gucci from "../assets/images/gucci.png";
import prada from "../assets/images/prada.png";
import zara from "../assets/images/zara.png";
import { useEffect, useRef } from "react";
import { setScrollTo } from "../state/slice";
import { useDispatch, useSelector } from "react-redux";


const Brands = () => {
  const brandsRef = useRef(null);
  const scrollTo = useSelector((state) => state.scroll.scrollTo);
  const dispatch = useDispatch();

  useEffect(() => {
    if (scrollTo === "brands") {
      brandsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      dispatch(setScrollTo(null));
    }
  }, [scrollTo]);
    return (
        <div ref={brandsRef} id="brands" className="bg-black w-full">
            <div className="container py-9.5 lg:py-11.5">
                <div className="flex flex-wrap justify-center gap-6 sm:gap-x-10 sm:gap-y-6 md:gap-x-15 md:gap-y-8 lg:gap-x-20 lg:gap-y-10 xl:gap-20 2xl:gap-25">
                    <img className="w-20 sm:w-32 md:w-40 h-5 md:h-8" src={versace} alt="brand logo" />
                    <img className="w-13 sm:w-25 md:w-23 h-6 md:h-9" src={zara} alt="brand logo" />
                    <img className="w-23 sm:w-32 md:w-39 h-5 md:h-9" src={gucci} alt="brand logo" />
                    <img className="w-25 sm:w-35 md:w-45 h-5 md:h-8" src={prada} alt="brand logo" />
                    <img className="w-27 sm:w-38 md:w-51 h-5 md:h-8" src={ck} alt="brand logo" />
                </div>
            </div>
        </div>
    )
}

export default Brands;
