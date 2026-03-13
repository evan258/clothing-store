import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useScrollRestoration } from "../useScrollRestoration";

const ContactForm = () => {
    const [formData, setFormData] = useState({name: "", email: "", text: ""});
    const recaptchaRef = useRef(null);
    const [errors, setErrors] = useState({});
    const [warning, setWarning] = useState("");
    const [captchaToken, setCaptchaToken] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();
    const navType = useNavigationType();
    const location = useLocation();

    useEffect(() => {
        useScrollRestoration(location, navType);
    }, []);


    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setErrors({});
        setWarning("");
        if (!captchaToken) {
            setWarning("Please complete the captcha");
            setTimeout(() => {
                setWarning("");
            }, 5000);
            setIsProcessing(false);
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...formData,
                    captchaToken
                }),
                credentials: "include"
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.name || data.email || data.text) {
                    setErrors(data);
                    return;
                } else {
                    setWarning(data.error);
                    setTimeout(() => {
                        setWarning("");
                    }, 5000);
                }
                return;
            }
            setFormData({name: "", email: "", text: ""});
            recaptchaRef.current.reset();
            setCaptchaToken(null);

            navigate("/contact/verification", {
                replace: true,
            });
        } catch (err) {
            setWarning("Something went wrong, Please try again");
            setTimeout(() => {
                setWarning("");
            }, 5000);
        }
        finally {
            setIsProcessing(false);
        }
    }

    return (
        <div className="container flex justify-center items-center h-screen">
            <div className="sm:max-w-125 max-w-auto bg-[#F0F0F0] rounded-4xl overflow-hidden px-5 md:px-6 lg:px-7 py-7 md:py-10 text-black">
                <h2 className="text-center mb-4 whitespace-nowrap">Contact Us</h2>
                <form 
                    onSubmit={handleSubmit}
                    className="w-full py-10"
                >
                    <label className="font-archivo font-extralight" htmlFor="name-field">Name</label>
                    <input 
                        required
                        id="name-field" 
                        name="name"
                        type="text" 
                        value={formData.name}
                        onChange={handleChange} 
                        placeholder="Enter your name"
                        className="w-full outline-none bg-white rounded-2xl p-2"
                        
                    />
                    {errors.name && <p className="text-red-600 my-4">{errors.name}</p>}
                    <label className="font-archivo font-extralight" htmlFor="email-field">Email</label>
                    <input 
                        required
                        id="email-field" 
                        name="email"
                        type="email" 
                        value={formData.email}
                        onChange={handleChange} 
                        placeholder="Enter your email"
                        className="w-full outline-none bg-white rounded-2xl p-2"
                    />
                    {errors.email && <p className="text-red-600 my-4">{errors.email}</p>}
                    <label className="font-archivo font-extralight" htmlFor="text-field">Message</label>
                    <textarea 
                        required
                        id="text-field"
                        name="text"
                        onChange={handleChange} 
                        placeholder="Enter your message" 
                        value={formData.text} 
                        className="w-full outline-none min-h-25 bg-white rounded-2xl p-2 resize-y my-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    />
                    {errors.text && <p className="text-red-600">{errors.text}</p>}
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        theme="light"
                        onChange={(token) => setCaptchaToken(token)}
                        onExpired={() => setCaptchaToken(null)}
                    />
                    <button disabled={isProcessing} type="submit" className="btn-dark my-4 disabled:cursor-not-allowed">{isProcessing? "Processing...": "Send Mail"}</button>
                    {warning && (
                        <div className="mt-4 px-3 py-2 bg-red-100 text-red-600 rounded-2xl">
                            {warning}
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}

export default ContactForm;
