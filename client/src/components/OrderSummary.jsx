import { useNavigate } from "react-router-dom";


const OrderSummary = ({subtotal, averageDiscount, totalDiscount, deliveryPrice, total, selectedDeliveryId}) => {
    const navigate = useNavigate(null);

    return (
        <div className="flex flex-col gap-4 md:gap-5 rounded-[20px] border border-[#F0F0F0] p-3 lg:px-6 lg:py-5 md:px-5 md:py-4">
            <h4 className="border-b border-[#F0F0F0] pb-4 md:pb-5 lg:pb-6">Order Summary</h4>
            <div className="border-b border-[#F0F0F0] pb-4 md:pb-5 lg:pb-6 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                    <span className="text-[rgba(0,0,0,0.6)]">Subtotal</span>
                    <h5>${(subtotal / 100).toFixed(2)}</h5>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[rgba(0,0,0,0.6)]">Discount{`(-${Math.floor(averageDiscount)})`}</span>
                    <h5>${(totalDiscount / 100).toFixed(2)}</h5>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[rgba(0,0,0,0.6)]">Delivery Fee</span>
                    <h5>${(deliveryPrice / 100).toFixed(2)}</h5>
                </div>
            </div>
            <div className="flex justify-between items-center pb-4 md:pb-5 lg:pb-6 gap-5">
                <span className="font-medium">Total</span>
                <h4>${(total / 100).toFixed(2)}</h4>
            </div>
            <button 
                onClick={() => navigate("/checkout", {
                    state: {
                        delivery_option_id: selectedDeliveryId,
                        total,
                    }
                })}
                className="btn-dark"
            >
                Go to Checkout
            </button>
        </div>
    )
}

export default OrderSummary;
