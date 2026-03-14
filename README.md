# Clothing Store Web Application

A full-stack e-commerce web application built with React, featuring product 
browsing, cart management, search functionality, order placement and payment method using Stripe integration.
Designed for both desktop and mobile devices, with smooth navigation and scroll restoration.

## Features

- **User Authentication**:  
  - Sign up and log in with email and password.  
  - For sign-ups, arbitrary emails are accepted for testing purposes.  

- **Contact & Support**:  
  - Users can submit inquiries through the “Contact Us” form accessible from Support section in the homepage or Support link in the footer.  
  - Requires a valid email and OTP verification to receive email and send response.  
  - Protected by reCAPTCHA to prevent spam.  

- **Scroll Restoration**:  
  - Scroll restoration is applied using a polling method.
  - But due to unexpected jump in scroll position while navigating to another page on mobile devices and inconsistency on desktop a bash fix logic was applied.
  - Basically an O(1) operation keeps running as long as user is on the page.
  - Not optimal but works consistently. 
  - Scroll restoration can sometimes be slow due to **Render free tier** delay.

- **Shopping & Orders**:  
  - Add products to cart and modify quantities.  
  - Search products using the search bar.  
  - Place orders using **Cash on Delivery (COD)** or **Stripe (test mode)**.  
  - To test card payments, use repeating `42` numbers for card fields and 
    a valid future expiry date (e.g., `4242 4242 4242 4242`).  

- **Navigation & Layout**:  
  - Responsive design for mobile and desktop.  
  - Smooth scroll-to-section navigation within the home page.  

## Deployment

The application is deployed on Render (free tier):  
[Clothing Store App](https://clothing-store-client-8rse.onrender.com)

---

## Notes

- This is a test/demo application; some validation (like email checks on 
  signup) is relaxed for testing purposes.  
- Scroll restoration is implemented using a continuous polling method 
  (O(1) operation). While it works reasonably well, it is not a fully 
  optimized solution and may show delays or glitches, especially on the free Render deployment.

