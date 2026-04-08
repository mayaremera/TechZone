import React from 'react';

const AboutUs = () => {
    return (
        <div className="bg-white py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-indigo-800 text-center mb-8">About Us</h1>

                <div className="space-y-8">
                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">BEST PRICES</h2>
                        <p className="text-gray-700">
                            At [TechZone], you will enjoy shopping with the best prices in the market, in addition to unbeatable offers and promotions.
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">PAYMENT METHODS</h2>
                        <p className="text-gray-700">
                            Enjoy the biggest variety of payment methods. Cash on delivery, credit card, installments, or via mobile wallets, we have them all for you. You pay the way you like.
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">WARRANTY</h2>
                        <p className="text-gray-700">
                            Anything you buy from [TechZone] has an agent warranty.
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">RETURN & REFUND</h2>
                        <p className="text-gray-700">
                            Enjoy 14 days return or refund on all your purchases.
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">DELIVERY</h2>
                        <p className="text-gray-700">
                            We are the FASTEST. Wherever you are, your order will be at your doorstep in just 2-5 working days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;