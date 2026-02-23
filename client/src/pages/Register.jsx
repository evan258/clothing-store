import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = ({setUser}) => {
    const [formData, setFormData] = useState({username: "", email: "", password: ""});
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => {
            return {
                ...prev,
                [name]: value,
            }
        });
        if (name == "password") {
            if (value.length > 4) {
                setError("Password can't be more than 4 characters.");
            } else if (value.length === 0) {
                setError("Password can't be empty");
            } else {
                setError("");
            }
        }
    }

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();

            if (!formData.email || !formData.password) {
                setError("All fields are required");
                return;
            } else if (formData.password.length > 4) {
                setError("Password too long, cannot submit");
                return;
            }
            setError("");
            const res = await fetch("http://localhost:3000/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            const userRes = await fetch("http://localhost:3000/me", {
                credentials: 'include',
            });
            const userData = await userRes.json();
            setUser(userData);
            navigate('/dashboard');
        } catch (err) {
            console.log(err);
            setError("Server error");
        }
    }

    return (
        <div className="flex justify-center items-center container h-screen">
            <div className="w-auto sm:w-100">
                <h1 className="text-center text-[30px]">Register</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-5">
                    <label htmlFor="email-field" className="font-archivo font-extralight">User Name</label>
                    <input 
                        name="username" type="text" placeholder="Enter your username" id="username-field" 
                        value={formData.username} onChange={handleChange} 
                        className="bg-[#F0F0F0] p-4 w-full rounded-xl" />
                    <label htmlFor="username-field" className="font-archivo font-extralight">Email</label>
                    <input 
                        name="email" type="email" placeholder="Enter your email" id="email-field" 
                        value={formData.email} onChange={handleChange} 
                        className="bg-[#F0F0F0] p-4 w-full rounded-xl" />
                    <label htmlFor="password-field" className="font-archivo font-extralight">Password</label>
                    <input 
                        name="password" type="password" placeholder="Enter your password" id="password-field" 
                        value={formData.password} onChange={handleChange}
                        className="bg-[#F0F0F0] p-4 w-full rounded-xl" />
                    <p className="text-red-500 font-bold text-sm h-2">{error}</p>
                    <button type="submit" className="btn-dark mt-3 whitespace-nowrap">Sign up</button>
                </form>
                <div className="flex relative justify-center items-center mt-5">
                    <div className="p-2 bg-white z-10">
                        <p className="leading-[160%] text-[18px]">Or</p>
                    </div>
                    <span className="absolute h-1 bg-[#F0F0F0] top-1/2 -translate-y-1/2 w-full"></span>
                </div>
                <p className="text-center text-[18px] leading-[160%]">Already have an account? <Link to="/login" className="text-blue-600 underline text-[18px] leading-[160%]">Log in</Link></p>
            </div>
        </div>
    );
}

export default Register;
