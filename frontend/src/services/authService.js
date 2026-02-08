import axios from "axios";

const API_URL = "http://127.0.0.1:5000";
console.log("AuthService API URL:", API_URL);

const register = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.token) {
        localStorage.setItem("token", response.data.token);
    }
    return response.data;
};

const login = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/login`, userData);
    if (response.data.token) {
        localStorage.setItem("token", response.data.token);
    }
    return response.data;
};

const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
};

const getCurrentUser = () => {
    const token = localStorage.getItem("token");
    return token;
};

const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
        return response.data;
    } catch (error) {
        console.error("Forgot Password API Error:", error);
        throw error;
    }
};

const verifyOtp = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/auth/verify-otp`, data);
        return response.data;
    } catch (error) {
        console.error("Verify OTP API Error:", error);
        throw error;
    }
};

const resetPassword = async (data) => {
    const response = await axios.post(`${API_URL}/auth/reset-password`, data);
    return response.data;
};

export default {
    register,
    login,
    logout,
    getCurrentUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
    API_URL,
};
