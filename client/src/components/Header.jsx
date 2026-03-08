import { useEffect, useRef, useState } from "react"
import logo from "../assets/images/logo.png";
import cart from "../assets/images/cart.svg";
import profile from "../assets/images/profile.png";
import chevronDown from "../assets/images/chevronDown.svg";
import chevronUp from "../assets/images/chevronUp.svg";
import search from "../assets/images/search.svg";
import toggle from "../assets/images/toggle.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Search from "./Search";
import { enablePageScroll, disablePageScroll } from "@fluejs/noscroll";

const Header = ({user, categories, scrollToBrands, scrollToNewArrivals, scrollToTrending}) => {
    const [navOpen, setNavOpen] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const shopRef = useRef(null);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (navOpen) {
            disablePageScroll();
        } else {
            enablePageScroll();
        }
    }, [navOpen]);

    useEffect(() => {
        if (!shopOpen && !searchOpen) return;
        const handleClickOutside = (e) => {
            if (shopOpen && shopRef.current && !shopRef.current.contains(e.target)) setShopOpen(false);
            if (searchOpen && searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    },[shopOpen, searchOpen]);

    const navToHome = () => {
        if (location.pathname !== '/') {
            navigate('/');
        }
    }

    return (
        <div className="relative container">
            <div className={`max-w-310 mx-auto flex justify-between items-center py-6 ${searchOpen?"pb-15 md:pb-18":""}`}>
                <div className="flex gap-4 items-center">
                    <button onClick={() => setNavOpen(!navOpen)} className="lg:hidden">
                        <img src={toggle} alt="menu toggle" />
                    </button>
                    <button onClick={navToHome}>
                        <img className="max-w-30 xl:max-w-40" src={logo} alt="logo" />
                    </button>
                </div>
                <div className={`${navOpen? "flex": "hidden"} lg:flex fixed top-17.5 left-0 right-0 bottom-0 bg-white lg:static z-50`}>
                    <ul className="flex flex-col lg:flex-row m-auto gap-6 lg:gap-4 xl:gap-6">
                        <li ref={shopRef} onClick={() => setShopOpen(!shopOpen)} className="relative mr-4 whitespace-nowrap">
                            <a className="whitesapce-nowrap cursor-pointer">Shop</a>
                            <button className="absolute left-full top-1/2 -translate-y-1/2 size-4">
                                {shopOpen? (
                                    <img src={chevronUp} alt="dropdown" />
                                ): (
                                    <img src={chevronDown} alt="dropdown" />
                                )}
                            </button>
                            {shopOpen && (
                                <ul className="absolute top-full left-0 bg-white z-10 flex flex-col gap-2 p-4">
                                    {categories.map((item) => {
                                        return (
                                            <li key={item.id}><Link to={`/products/categories/${item.id}`}>{item.name}</Link></li>
                                        )
                                    })}
                                </ul>
                            )}
                        </li>
                        <li onClick={() => {
                                setNavOpen(false);
                                scrollToTrending();
                            }}
                        >
                            <a className="cursor-pointer whitespace-nowrap">Top Selling</a>
                        </li>
                        <li onClick={() => {
                                setNavOpen(false);
                                scrollToNewArrivals();
                            }}
                        >
                            <a className="cursor-pointer whitespace-nowrap">New Arrivals</a>
                        </li>
                        <li onClick={() => {
                                setNavOpen(false);
                                scrollToBrands();
                            }}
                        >
                            <a className="cursor-pointer whitespace-nowrap">Brands</a>
                        </li>
                    </ul>
                </div>
                <div className="hidden lg:block w-[45%]">
                    <Search />
                </div>
                <div ref={searchRef} className="flex gap-3 xl:gap-4 items-center">
                    <button onClick={() => {
                        if (!navOpen) setSearchOpen(!searchOpen);
                    }} 
                    className="lg:hidden size-6">
                        <img src={search} alt="search" />
                    </button>
                    {searchOpen && (
                        <div className="absolute bottom-2 md:bottom-3 left-0 right-0 min-w-max z-10">
                            <Search inputRef={inputRef} />
                        </div>
                    )}
                    <Link to="/cart">
                        <button className="relative size-6">
                            <img src={cart} alt="cart" />
                            {user?.cart_count > 0 && (
                                <span className="text-lg text-red-700 font-extrabold absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                                    {user.cart_count}
                                </span>
                            )}
                        </button>
                    </Link>
                    <Link to={user? `/dashboard/${user.id}`: "/Login"}>
                        <button className="size-6">
                            <img src={profile} alt="profile" />
                        </button>
                    </Link>            
                </div>
            </div>
        </div>
    );
}

export default Header;
