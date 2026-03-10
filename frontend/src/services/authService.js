import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
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

const getProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error("Get Profile Error:", error);
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
        }
        throw error;
    }
};

const updateProfile = async (userData) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    const response = await axios.put(`${API_URL}/auth/update-profile`, userData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const changePassword = async (passwordData) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");
    const response = await axios.post(`${API_URL}/auth/change-password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` },
    });
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
    getProfile,
    updateProfile,
    changePassword,
    API_URL,
};
