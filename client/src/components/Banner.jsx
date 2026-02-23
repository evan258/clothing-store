import banner from "../assets/images/banner.png";
import bannerStar from "../assets/images/bannerStar.png";
import ck from "../assets/images/ck.png";
import versace from "../assets/images/versace.png";
import gucci from "../assets/images/gucci.png";
import prada from "../assets/images/prada.png";
import zara from "../assets/images/zara.png";

const Banner = () => {
    return (
        <>
            <div className="w-full bg-[#F0F0F0]" >
                <div className="container">
                    <div className="max-w-310 mx-auto grid lg:grid-cols-2 gap-12.5 justify-items-center">
                        <div className="max-w-78.75 md:max-w-100 lg:max-w-137 py-10 sm:py-12 md:py-15 xl:py-20 2xl:py-25">
                            <h1>FIND CLOTHES THAT MATCHES YOUR STYLE</h1>
                            <p className="my-8">Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.</p>
                            <button className="btn-dark">Shop now</button>
                            <div className="flex flex-wrap xl:flex-nowrap justify-center gap-4 lg:gap-6 w-full mt-12">
                                <div>
                                    <h2 className="font-satoshi">200+</h2>
                                    <p>International Brands</p>
                                </div>
                                <div className="w-px h-full bg-[#F0F0F0]"></div>
                                <div>
                                    <h2 className="font-satoshi">2,000+</h2>
                                    <p>High-Quality Products</p>
                                </div>
                                <div className="w-px h-full bg-[#F0F0F0]"></div>
                                <div>
                                    <h2 className="font-satoshi">30,000+</h2>
                                    <p>Happy Customers</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <img className="h-full" src={banner} alt="banner" />
                            <img src={bannerStar} className="size-19 lg:size-26 absolute top-[10%] right-[10%]" />
                            <img src={bannerStar} className="size-14 absolute top-1/2 left-0" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-black w-full">
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
        </>
    );
}

export default Banner;
