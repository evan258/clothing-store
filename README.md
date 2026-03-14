
# Clothing Store Web Application

A full-stack **e-commerce web application** built with React, 
featuring product browsing, cart management, search functionality, 
order placement and payment methods using Stripe integration.  

Designed for both **desktop and mobile devices**, with smooth navigation and scroll restoration.

---

## **Features**

### **User Authentication**
- Sign up and log in with email and password.
- For sign-ups, arbitrary invalid emails are accepted for testing purposes.

---

### **Contact & Support**
- Users can submit inquiries through the **Contact Us** form accessible 
  from the **Support section on the homepage** or via the **Support link in the footer**.
- Requires a **valid email and OTP verification** to receive a response.
- Protected by **reCAPTCHA** to prevent spam.

---

### **Scroll Restoration**
- Scroll restoration is applied using a **polling method**.
- Due to unexpected scroll position jumps when navigating between pages on **mobile devices**, and inconsistent behavior on desktop browsers, a fallback logic was implemented.
- Essentially, a constant **O(1) operation keeps running continuously as long as the user is on the page** to maintain the correct scroll position.
- This is **not an optimal solution**, but works consistently in practice.
- Scroll restoration may occasionally be slower due to **Render free tier delays**.

---

### **Shopping & Orders**
- Add products to the **cart** and modify quantities.
- Search for products using the **search bar**.
- Place orders using:
  - **Cash on Delivery (COD)**
  - **Stripe (test mode)**
- Orders appear in the **user dashboard**, sorted by **most recent first**.
- Failed or pending **Stripe PaymentIntents** are stored and can be **retried using the same PaymentIntent**, 
  allowing users to attempt payment again without creating duplicate transactions.
- During checkout, **database transactions with row-level locking (`SELECT ... FOR UPDATE`)** are used to prevent race conditions and **avoid overselling stock**.
- When an order is created, stock is **temporarily reserved**.  
  If payment is not completed, **pending orders automatically expire after 15 minutes**, restoring the reserved stock so other users can purchase the items.
- To test Stripe payments, use repeating **42** numbers for all card fields with a valid future expiry date 
  (e.g., 4242 4242 4242 4242).

---

### **Navigation & Layout**
- Responsive design for both **desktop and mobile devices**.
- Smooth **scroll-to-section navigation** from any page to the homepage.

---

## **Deployment**
The application is deployed on **Render (free tier)**:
[Clothing Store App](https://clothing-store-client-8rse.onrender.com)

---

## **Notes**
- This is a **test/demo application**; some validation (such as strict email verification on signup) is intentionally relaxed for easier testing.
- Scroll restoration is implemented using a **continuous polling approach**. While it works reasonably well, it is not fully optimized and may occasionally show delays.
- Performance can also vary due to **Render free tier deployment**.
