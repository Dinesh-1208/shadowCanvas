import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User, 
    Mail, 
    Trash2, 
    LogOut, 
    Camera, 
    Lock,
    Save,
    X,
    Check,
    ChevronRight,
    ArrowLeft
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../../services/authService";

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [nameDraft, setNameDraft] = useState("");
    
    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await authService.getProfile();
            setUser(data);
            setNameDraft(data.name);
        } catch (error) {
            console.error("Failed to fetch profile", error);
            setMessage({ type: "error", text: "Failed to load profile." });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!nameDraft || nameDraft === user.name) return;
        setIsSaving(true);
        try {
            const updatedUser = await authService.updateProfile({ name: nameDraft });
            setUser(updatedUser);
            setMessage({ type: "success", text: "Name updated successfully!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: "Update failed." });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic file size check (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: "error", text: "File is too large (max 5MB)." });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result;
            setIsSaving(true);
            try {
                console.log("Updating profile photo...");
                const updatedUser = await authService.updateProfile({ profilePicture: base64Image });
                setUser(updatedUser);
                setMessage({ type: "success", text: "Profile photo updated!" });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            } catch (error) {
                console.error("Photo update error:", error);
                setMessage({ type: "error", text: error.response?.data?.message || "Photo update failed." });
            } finally {
                setIsSaving(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.onerror = () => {
            setMessage({ type: "error", text: "Failed to read file." });
        };
    };

    const handleRemovePhoto = async () => {
        setIsSaving(true);
        try {
            console.log("Removing profile photo...");
            const updatedUser = await authService.updateProfile({ profilePicture: "" });
            setUser(updatedUser);
            setMessage({ type: "success", text: "Profile photo removed." });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            console.error("Photo removal error:", error);
            setMessage({ type: "error", text: "Photo removal failed." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match." });
            return;
        }
        setIsChangingPassword(true);
        try {
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Password change failed." });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate("/login");
    };

    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure? This is permanent.")) {
            setMessage({ type: "error", text: "Contact support to finalize deletion." });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#b2a4ff] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#b2a4ff] text-white flex flex-col font-sans relative overflow-hidden">
            {/* Background blobs for depth */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9281ff] rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#c7bdff] rounded-full blur-[120px] opacity-60 pointer-events-none"></div>

            {/* Main Content */}
            <main className="flex-grow min-h-screen overflow-y-auto pb-20 relative z-10">
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/20">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button"
                            onClick={() => navigate("/")} 
                            className="p-2.5 hover:bg-[#1a103d]/10 rounded-full transition-all text-[#1a103d] flex items-center gap-2 group"
                            title="Go back"
                        >
                            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-bold md:block hidden">Back</span>
                        </button>
                        <span className="text-xs font-bold text-[#1a103d]/40 uppercase tracking-widest">Settings / Profile</span>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto pt-8 px-8">
                    <h1 className="text-4xl font-black text-[#1a103d] mb-10 tracking-tight">My profile</h1>

                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`mb-6 p-4 rounded-2xl text-sm font-bold shadow-xl backdrop-blur-md ${
                                    message.type === "success" ? "bg-green-500/20 text-green-900 border border-green-500/30" : "bg-red-500/20 text-red-900 border border-red-500/30"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {message.type === "success" ? <Check size={18} /> : <X size={18} />}
                                    {message.text}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-8">
                        {/* Profile Picture */}
                        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/30 shadow-xl">
                            <div>
                                <h2 className="text-xl font-bold text-[#1a103d] mb-1">Profile Picture</h2>
                                <p className="text-sm text-[#1a103d]/60 font-medium">Add a touch of personality to your profile.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-24 h-24 bg-[#1a103d] rounded-[24px] flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white/20 overflow-hidden">
                                        {user.profilePicture ? (
                                            <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            user.name.charAt(0)
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current.click()}
                                        className="absolute bottom-2 right-2 bg-white text-[#1a103d] p-2 rounded-xl shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Camera size={16} />
                                    </button>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handlePhotoUpdate} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current.click()} 
                                        className="mt-3 text-[12px] font-black text-[#1a103d] hover:bg-[#1a103d] hover:text-white px-5 py-2 rounded-full transition-all border border-[#1a103d]/20 shadow-sm active:scale-95"
                                    >
                                        Update
                                    </button>
                                    {user.profilePicture && (
                                        <button 
                                            type="button"
                                            onClick={handleRemovePhoto} 
                                            className="mt-3 text-[12px] font-black text-red-600 hover:bg-red-600 hover:text-white px-5 py-2 rounded-full transition-all border border-red-600/20 shadow-sm active:scale-95"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Profile Name */}
                        <section className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6 bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/30 shadow-xl">
                            <div className="max-w-sm">
                                <h2 className="text-xl font-bold text-[#1a103d] mb-1">Profile Name</h2>
                                <p className="text-sm text-[#1a103d]/60 font-medium">This is how you'll appear to others.</p>
                            </div>
                            <div className="w-full md:w-80">
                                <div className="relative group mb-4">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a103d]/40" />
                                    <input 
                                        type="text" 
                                        value={nameDraft}
                                        onChange={(e) => setNameDraft(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                                        className="w-full bg-white/40 border-2 border-transparent rounded-[20px] pl-12 pr-4 py-3.5 text-sm font-bold text-[#1a103d] focus:outline-none focus:border-[#1a103d]/20 focus:bg-white/60 transition-all placeholder-[#1a103d]/30"
                                        placeholder="Enter your name"
                                    />
                                    {isSaving && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-[#1a103d] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleUpdateName}
                                    disabled={isSaving || !nameDraft || nameDraft === user?.name}
                                    className="w-full py-2.5 bg-[#1a103d] text-white rounded-[16px] text-xs font-bold hover:bg-[#251854] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Save size={14} /> Save Name
                                </button>
                            </div>
                        </section>

                        {/* Account Email */}
                        <section className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6 bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/30 shadow-xl">
                            <div className="max-w-sm">
                                <h2 className="text-xl font-bold text-[#1a103d] mb-1">Account Email</h2>
                                <p className="text-sm text-[#1a103d]/60 font-medium">Your primary contact for notifications.</p>
                            </div>
                            <div className="w-full md:w-80">
                                <div className="flex items-center gap-3 bg-[#1a103d]/5 border border-[#1a103d]/10 p-4 rounded-2xl">
                                    <Mail size={16} className="text-[#1a103d]/40" />
                                    <span className="text-sm font-bold text-[#1a103d]">{user.email}</span>
                                </div>
                            </div>
                        </section>

                        {/* Change Password */}
                        <section className="p-6 bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/30 shadow-xl">
                            <h2 className="text-xl font-bold text-[#1a103d] mb-6 flex items-center gap-2">
                                <Lock size={20} /> Change Password
                            </h2>
                            <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-black text-[#1a103d]/40 uppercase tracking-widest block mb-1.5 px-1">Current Password</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        className="w-full bg-white/40 border-2 border-transparent rounded-[20px] px-5 py-3 text-sm font-bold text-[#1a103d] focus:outline-none focus:border-[#1a103d]/20"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-[#1a103d]/40 uppercase tracking-widest block mb-1.5 px-1">New Password</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        className="w-full bg-white/40 border-2 border-transparent rounded-[20px] px-5 py-3 text-sm font-bold text-[#1a103d] focus:outline-none focus:border-[#1a103d]/20"
                                        placeholder="New password"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-[#1a103d]/40 uppercase tracking-widest block mb-1.5 px-1">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        className="w-full bg-white/40 border-2 border-transparent rounded-[20px] px-5 py-3 text-sm font-bold text-[#1a103d] focus:outline-none focus:border-[#1a103d]/20"
                                        placeholder="Confirm selection"
                                    />
                                </div>
                                <div className="md:col-span-2 pt-2">
                                    <button 
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="w-full py-4 bg-[#1a103d] text-white rounded-[20px] font-bold shadow-lg hover:bg-[#251854] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                                    >
                                        {isChangingPassword ? (
                                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Save size={18} /> Update Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Sign out & Delete */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="p-6 bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/30 shadow-xl">
                                <h2 className="text-xl font-bold text-[#1a103d] mb-1">Sign Out</h2>
                                <p className="text-sm text-[#1a103d]/60 font-medium mb-4">Safely log off your account.</p>
                                <button 
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full py-3.5 bg-[#1a103d] text-white rounded-[20px] font-bold hover:bg-[#251854] transition-all shadow-lg active:scale-[0.98]"
                                >
                                    Log Out
                                </button>
                            </section>

                            <section className="p-6 bg-white/20 backdrop-blur-xl rounded-[32px] border border-white/30 shadow-xl">
                                <h2 className="text-xl font-bold text-red-600 mb-10">Delete Account</h2>
                                <button 
                                    type="button"
                                    onClick={handleDeleteAccount} 
                                    className="w-full py-3.5 bg-red-100/50 text-red-600 border border-red-500/20 rounded-[20px] font-bold hover:bg-red-500 hover:text-white transition-all active:scale-[0.98]"
                                >
                                    Delete Account
                                </button>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
