import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from "../../config";

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(`${API_URL}/verify_email/${token}`, {
                    method: 'GET',
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Verification failed');
                }

                setMessage(data.message);
                setTimeout(() => navigate('/login'), 3000);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [token, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
                {loading && <p className="text-indigo-500">Verifying your email...</p>}
                {message && (
                    <div className="p-3 bg-green-100 text-green-700 rounded">
                        {message}
                        <p>Redirecting to login...</p>
                    </div>
                )}
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded">
                        {error}
                        <p>
                            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                                Go to Login
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;