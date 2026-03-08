import logo from "../assets/images/logo.png";
import github from "../assets/images/github.png";
import { Link } from "react-router-dom";

const Footer = ({brandsRef, reviewsRef, bannerRef, scrollToElement, scrollToTop}) => {
    return (
        <div className="relative bg-[#F0F0F0] w-full pt-47.5 sm:44 md:40 lg:37 xl:pt-35 pb-19 md:pb-20 lg:pb-22 mt-52 sm:mt-48 md:mt-44 lg:mt-40">
            <div className="container">
                <div className="max-w-310 mx-auto flex flex-wrap justify-between gap-x-20 gap-y-6 md:gap-y-8 lg:gap-y-10">
                    <div className="w-full lg:max-w-62.5">
                        <img onClick={scrollToTop} className="cursor-pointer" src={logo} alt="logo" />
                        <p className="pt-3.5 pb-5 md:pt-4.5 md:pb-6.5 lg:pt-6 lg:pb-8 text-[rgba(0,0,0,0.6)] xl:text-[14px]">We have clothes that suits your style and which you’re proud to wear. From women to men.</p>
                        <a href="https://github.com/evan258/Ecommerce-page" target="_blank">
                            <img src={github} alt="link" />
                        </a>
                    </div>
                    <div>
                        <h5 className="font-medium leading-4.5 text-[14px] tracking-[3px] md:text-[15px] lg:text-[16px]">Company</h5>
                        <ul className="flex flex-col text-[rgba(0,0,0,0.6)] pt-4 md:pt-5 lg:pt-6 gap-1 md:gap-1.5 lg:gap-2">
                            <li><a className="text-[14px] leading-4 lg:text-[16px] lg:leading-4.75 md:text-[15px] md:leading-[17.5px] cursor-pointer" onClick={() => scrollToElement(bannerRef)}>About</a></li>
                            <li><a className="text-[14px] leading-4 lg:text-[16px] lg:leading-4.75 md:text-[15px] md:leading-[17.5px] cursor-pointer" onClick={() => scrollToElement(reviewsRef)}>Reviews</a></li>
                            <li><a className="text-[14px] leading-4 lg:text-[16px] lg:leading-4.75 md:text-[15px] md:leading-[17.5px] cursor-pointer" onClick={() => scrollToElement(brandsRef)}>Brands</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-medium leading-4.5 text-[14px] tracking-[3px] md:text-[15px] lg:text-[16px]">Help</h5>
                        <ul className="flex flex-col text-[rgba(0,0,0,0.6)] pt-4 md:pt-5 lg:pt-6 gap-1 md:gap-1.5 lg:gap-2">
                            <li><Link className="text-[14px] leading-4 lg:text-[16px] lg:leading-4.75 md:text-[15px] md:leading-[17.5px]" to="/contact">Support</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-medium leading-4.5 text-[14px] tracking-[3px] md:text-[15px] lg:text-[16px]">FAQ</h5>
                        <ul className="flex flex-col text-[rgba(0,0,0,0.6)] pt-4 md:pt-5 lg:pt-6 gap-1 md:gap-1.5 lg:gap-2">
                            <li><Link className="text-[14px] leading-4 lg:text-[16px] lg:leading-4.75 md:text-[15px] md:leading-[17.5px]" to="/dashboard">Account</Link></li>
                            <li><Link className="text-[14px] leading-4 lg:text-[16px] lg:leading-4.75 md:text-[15px] md:leading-[17.5px]" to="/dashboard" href="#">Orders</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-medium leading-4.5 text-[14px] tracking-[3px] md:text-[15px] lg:text-[16px]">Resources</h5>
                        <ul className="flex flex-col text-[rgba(0,0,0,0.6)] pt-4 md:pt-5 lg:pt-6 gap-1 md:gap-1.5 lg:gap-2">
                            <li><a className="text-[14px] leading-4 lg:text-[16px] lg:leading-4.75 md:text-[15px] md:leading-[17.5px]" href="https://github.com/evan258/Ecommerce-page" target="_blank">Source Code</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-1/2 container">
                <div className="max-w-310 mx-auto w-full rounded-[20px] bg-black text-white px-6 py-8 md:px-12 md:py-9 lg:px-14 lg:py-10 xl:px-16 xl:py-11">
                    <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between gap-3">
                        <h2 className="max-w-150 text-center md:text-start">FOR MORE SUPPORT CONTACT US</h2>
                        <Link to="/contact" className="inline-block btn-dark flex-1 bg-white text-black max-w-87.5 font-medium text-center">Send Us an Email</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Footer;
