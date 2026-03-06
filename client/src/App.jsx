import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import ReviewForm from "./pages/ReviewForm.jsx";
import EditReview from "./pages/EditReview.jsx";
import Footer from "./components/Footer.jsx";
import Cart from "./pages/Cart.jsx";
import OrderForm from "./pages/OrderForm.jsx";
import CheckoutWrapper from "./pages/CheckoutWrapper.jsx";
import Catalogue from "./pages/Catalogue.jsx";

function App() {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('http://localhost:3000/me', {
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
                const res = await fetch("http://localhost:3000/categories");
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
            <Route path="/" element={<Home user={user} categories={categories} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register setUser={setUser} />} />
            <Route path="/products/:id" element={<ProductDetails user={user} setUser={setUser} categories={categories} />} />
            <Route path="/reviews/post/:id" element={<ReviewForm />} />
            <Route path="/reviews/put/:id" element={<EditReview />} />
            <Route path="/cart" element={<Cart user={user} setUser={setUser} categories={categories} />} />
            <Route path="/checkout" element={<OrderForm />} />
            <Route path="/checkout/:id/payment" element={<CheckoutWrapper />} />
            <Route path="/products/categories/:id" element={<Catalogue user={user} categories={categories} />} />
        </Routes>
        <Footer />
      </>
  );
}

export default App;
