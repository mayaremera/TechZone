import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { API_URL } from "../../config";

const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useParams();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        newPassword: '',
        repassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const mode = location.pathname.includes('signup')
        ? 'signup'
        : location.pathname.includes('forgot-password')
            ? 'forgot-password'
            : location.pathname.includes('reset-password')
                ? 'reset-password'
                : 'login';

    useEffect(() => {
        if (mode === 'reset-password' && !token) {
            setError('Reset token is missing');
        } else if (mode === 'reset-password' && token) {
            // Initial load with token, set message to prompt for new password
            setMessage('Please enter your new password to reset it.');
        }
    }, [mode, token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            let url = '';
            let body = {};

            if (mode === 'signup') {
                if (formData.password !== formData.repassword) {
                    throw new Error("Passwords don't match!");
                }
                if (!formData.displayName.trim()) {
                    throw new Error('Display name cannot be empty');
                }
                url = `${API_URL}/signup`;
                body = { name: formData.displayName, email: formData.email, password: formData.password };
            } else if (mode === 'login') {
                url = `${API_URL}/login`;
                body = { email: formData.email, password: formData.password };
            } else if (mode === 'forgot-password') {
                url = `${API_URL}/forgot_password`;
                body = { email: formData.email };
            } else if (mode === 'reset-password') {
                url = `${API_URL}/reset_password/${token}`;
                body = { password: formData.newPassword };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setMessage(data.message);

            if (mode === 'login') {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('role', data.role);
                navigate('/dashboard');
            } else if (mode === 'signup') {
                navigate('/check-email');
            } else if (mode === 'forgot-password' || mode === 'reset-password') {
                navigate('/login');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                    {mode === 'signup' && 'Create an Account'}
                    {mode === 'login' && 'Welcome Back!'}
                    {mode === 'forgot-password' && 'Forgot Password'}
                    {mode === 'reset-password' && 'Reset Password'}
                </h2>

                {message && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                            type="text"
                            name="displayName"
                            placeholder="Enter your display name"
                            value={formData.displayName}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    )}
                    {(mode === 'signup' || mode === 'login' || mode === 'forgot-password') && (
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    )}
                    {(mode === 'signup' || mode === 'login') && (
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    )}
                    {mode === 'signup' && (
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                            type="password"
                            name="repassword"
                            placeholder="Confirm your password"
                            value={formData.repassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    )}
                    {mode === 'reset-password' && (
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition"
                            type="password"
                            name="newPassword"
                            placeholder="Enter new password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    )}

                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-700 to-indigo-900 text-white font-semibold py-3 rounded-lg hover:from-[#1D267D] hover:to-[#004AAD] transition duration-300 shadow-md disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading
                                ? 'Processing...'
                                : mode === 'signup'
                                    ? 'Sign Up'
                                    : mode === 'login'
                                        ? 'Sign In'
                                        : mode === 'forgot-password'
                                            ? 'Send Reset Link'
                                            : 'Reset Password'}
                        </button>

                        {mode === 'login' && (
                            <button
                                type="button"
                                className="w-full bg-white border border-indigo-500 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition duration-300 shadow-sm disabled:opacity-50"
                                onClick={() => navigate('/signup')}
                                disabled={loading}
                            >
                                Create Account
                            </button>
                        )}
                        {mode === 'signup' && (
                            <button
                                type="button"
                                className="w-full bg-white border border-indigo-500 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition duration-300 shadow-sm disabled:opacity-50"
                                onClick={() => navigate('/login')}
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        )}
                        {mode === 'forgot-password' && (
                            <button
                                type="button"
                                className="w-full bg-white border border-indigo-500 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition duration-300 shadow-sm disabled:opacity-50"
                                onClick={() => navigate('/login')}
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        )}
                        {mode === 'reset-password' && (
                            <button
                                type="button"
                                className="w-full bg-white border border-indigo-500 text-indigo-700 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition duration-300 shadow-sm disabled:opacity-50"
                                onClick={() => navigate('/login')}
                                disabled={loading}
                            >
                                Back to Login
                            </button>
                        )}

                        <button
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-3 rounded-lg hover:bg-gray-200 transition duration-300 shadow-sm disabled:opacity-50"
                            disabled={loading}
                            onClick={() =>
                                alert('Google Sign-In not implemented yet - contact backend dev to add OAuth support')
                            }
                        >
                            <FcGoogle size={20} />
                            Sign in with Google
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        {mode === 'login' && (
                            <>
                                <p className="text-gray-500 text-sm">
                                    Forgot your password?{' '}
                                    <Link to="/forgot-password" className="text-indigo-600 font-medium hover:underline">
                                        Reset it
                                    </Link>
                                </p>
                                {localStorage.getItem('token') && (
                                    <button onClick={handleLogout} className="mt-2 text-red-600 font-medium hover:underline">
                                        Logout
                                    </button>
                                )}
                            </>
                        )}
                        {mode === 'signup' && (
                            <p className="text-gray-500 text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;