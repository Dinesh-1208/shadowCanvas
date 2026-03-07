import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SharedLinkJoin() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    useEffect(() => {
        const joinCanvas = async () => {
            try {
                const authToken = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:3000/api/canvas/shared/${token}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });

                if (res.data.success && res.data.canvas.roomCode) {
                    navigate(`/canvas/${res.data.canvas.roomCode}`, { replace: true });
                } else {
                    setError("Failed to join via shared link.");
                }
            } catch (err) {
                console.error("Shared link error", err);
                setError(err.response?.data?.error || "Invalid or expired link.");
            }
        };

        joinCanvas();
    }, [token, navigate]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/my-canvases')}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Go to My Canvases
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Validating your access...</p>
        </div>
    );
}
