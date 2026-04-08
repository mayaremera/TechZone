import React from 'react';

const CustomerSupport = () => {
    return (
        <div className="bg-white py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-indigo-800 text-center mb-8">Customer Support</h1>

                <div className="space-y-8">
                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">CONTACT US</h2>
                        <p className="text-gray-700">
                            Our customer support team is available to assist you Monday through Friday, 9:00 AM to 6:00 PM. Feel free to reach out via phone, email, or live chat.
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">PHONE SUPPORT</h2>
                        <p className="text-gray-700">
                            Call us at: (XXX) XXX-XXXX
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">EMAIL SUPPORT</h2>
                        <p className="text-gray-700">
                            Send your inquiries to: support@yourcompany.com
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">LIVE CHAT</h2>
                        <p className="text-gray-700">
                            Connect with our support team instantly through the chat widget in the bottom right corner of our website.
                        </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h2 className="text-xl font-semibold text-indigo-700 mb-2">FAQ</h2>
                        <p className="text-gray-700">
                            Check our frequently asked questions section for quick answers to common inquiries about orders, shipping, returns, and more.
                        </p>
                    </div>

                    <div className="mt-10 text-center">
                        <button className="px-6 py-3 bg-gradient-to-r from-[#004AAD] to-[#1D267D] hover:from-[#1D267D] hover:to-[#004AAD] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                            Contact Support Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSupport;