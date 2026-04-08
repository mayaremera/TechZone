import React from 'react';
import { Link } from 'react-router-dom';

const CheckEmail = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Check Your Email</h2>
                <p className="mb-4">We’ve sent a verification link to your email. Please check your inbox (and spam/junk folder) to verify your email address.</p>
                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                    Back to Login
                </Link>
            </div>
        </div>
    );
};

export default CheckEmail;