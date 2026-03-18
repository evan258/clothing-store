import { useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import ReviewForm from "./pages/ReviewForm.jsx";
import EditReview from "./pages/EditReview.jsx";
import Cart from "./pages/Cart.jsx";
import OrderForm from "./pages/OrderForm.jsx";
import CheckoutWrapper from "./pages/CheckoutWrapper.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import ContactForm from "./pages/ContactForm.jsx";
import Verification from "./pages/Verfication.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Footer from "./components/Footer.jsx";

function App() {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState(null);
    const location = useLocation();

    useEffect(() => {
        let current = window.scrollY;
        let prev;
        let running = true;
        const handleScroll = () => {
            prev = current;
            current = window.scrollY;
            if (running) requestAnimationFrame(handleScroll);
        }
        requestAnimationFrame(handleScroll);
        return () => {
            running = false;
            sessionStorage.setItem(`scrollY${location.pathname}${location.search}`, prev);
        }
    }, [location.pathname, location.search]);

    const brandsRef = useRef(null);
    const newArrivalsRef = useRef(null);
    const trendingRef = useRef(null);
    const categoriesRef = useRef(null);
    const bannerRef = useRef(null);
    const reviewsRef = useRef(null);
    const homeRef = useRef(null);

    const scrollToTop = () => {
        requestAnimationFrame(() => {
            if (homeRef.current) {
                homeRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    }


    const scrollToElement = (element) => {
        requestAnimationFrame(() => {
            if (element.current) {
                element.current.scrollIntoView({
                    behavior: "smooth",
                    block: `${(element === brandsRef || element === reviewsRef)? "center": "start"}`
                });
            }
        });
    }

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
                    credentials: 'include',
                });
                if (!res.ok) {
                    setUser(null);
                    return;
                }
                const data = await res.json();
                if (data) {
                    setUser(data);
                }
            } catch (err) {
                console.log(err);
                setUser(null);
            }
        }
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
                if (!res.ok) {
                    setCategories(null);
                    return;
                }
                const categories = await res.json();
                if (categories) {
                    setCategories(categories);
                    console.log(categories);
                }
            } catch (err) {
                console.log(err);
                setCategories(null);
            }
        }
        fetchUser();
        fetchCategories();
    },[]);

  return (
      <>
        <Routes>
            <Route path="/" 
                element={<Home 
                    user={user}
                    categories={categories} 
                    brandsRef={brandsRef}
                    newArrivalsRef={newArrivalsRef} 
                    trendingRef={trendingRef}
                    categoriesRef={categoriesRef}
                    reviewsRef={reviewsRef}
                    bannerRef={bannerRef}
                    homeRef={homeRef}
                    scrollToElement={scrollToElement}
                    scrollToTop={scrollToTop}
                />}
            />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
            <Route path="/products/:id" 
                element={<ProductDetails 
                    user={user} 
                    setUser={setUser} 
                    categories={categories} 
                    brandsRef={brandsRef} 
                    newArrivalsRef={newArrivalsRef} 
                    trendingRef={trendingRef} 
                    bannerRef={bannerRef} 
                    reviewsRef={reviewsRef} 
                    scrollToElement={scrollToElement} 
                    scrollToTop={scrollToTop} 
                />} 
            />
            <Route path="/reviews/post/:id" element={<ReviewForm />} />
            <Route path="/reviews/put/:id" element={<EditReview />} />
            <Route path="/cart" 
                element={<Cart 
                    user={user} 
                    setUser={setUser} 
                    categories={categories} 
                    brandsRef={brandsRef} 
                    newArrivalsRef={newArrivalsRef} 
                    trendingRef={trendingRef} 
                    bannerRef={bannerRef} 
                    reviewsRef={reviewsRef} 
                    scrollToElement={scrollToElement} 
                    scrollToTop={scrollToTop} 
                />} 
            />
            <Route path="/checkout" element={<OrderForm user={user} setUser={setUser} />} />
            <Route path="/checkout/:id/payment" element={<CheckoutWrapper user={user} />} />
            <Route path="/products/categories/:id" 
                element={<Catalogue 
                    user={user} 
                    categories={categories} 
                    brandsRef={brandsRef} 
                    newArrivalsRef={newArrivalsRef} 
                    trendingRef={trendingRef} 
                    bannerRef={bannerRef} 
                    reviewsRef={reviewsRef} 
                    scrollToElement={scrollToElement} 
                    scrollToTop={scrollToTop} 
                />} 
            />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/contact/verification" element={<Verification />} />
            <Route path="/dashboard/:id" 
                element={<Dashboard 
                    setUser={setUser}
                    user={user}
                    categories={categories}
                    brandsRef={brandsRef}
                    newArrivalsRef={newArrivalsRef}
                    trendingRef={trendingRef}
                    bannerRef={bannerRef}
                    scrollToElement={scrollToElement} 
                    scrollToTop={scrollToTop}
                />} 
            />
        </Routes>
        <Footer
            user={user}
            brandsRef={brandsRef}
            reviewsRef={reviewsRef}
            bannerRef={bannerRef}
            scrollToElement={scrollToElement}
            scrollToTop={scrollToTop}
        />
      </>
  );
}

export default App;
