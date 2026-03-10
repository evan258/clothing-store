import banner from "../assets/images/banner.png";
import bannerStar from "../assets/images/bannerStar.png";

const Banner = ({scrollToCategories}) => {
    return (
        <div className="w-full bg-[#F0F0F0] min-h-227.75 sm:min-h-261 lg:min-h-129.5 xl:min-h-151.5" >
            <div className="container">
                <div className="max-w-310 mx-auto grid lg:grid-cols-2 gap-12.5 justify-items-center">
                    <div className="max-w-78.75 md:max-w-100 lg:max-w-137 py-10 sm:py-12 md:py-15 xl:py-20 2xl:py-25">
                        <h1>FIND CLOTHES THAT MATCHES YOUR STYLE</h1>
                        <p className="my-8">Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality and cater to your sense of style.</p>
                        <button onClick={scrollToCategories} className="btn-dark">Shop now</button>
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
   );
}

export default Banner;
