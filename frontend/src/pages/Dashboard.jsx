import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Clock, Users, Layout, PlusCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const [myCanvases, setMyCanvases] = useState([]);
    const [sharedCanvases, setSharedCanvases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCanvases();
    }, []);

    const fetchCanvases = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/canvases');
            if (!response.ok) throw new Error('Failed to fetch canvases');
            const data = await response.json();

            // For now, let's treat all as personal or shared based on mock logic
            // In real app, we would filter by ownerId
            setMyCanvases(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching canvases:', err);
            setError(err.message);
            setLoading(false);

            // Fallback to mock data if backend fails
            setMyCanvases([
                { id: 1, title: 'Network Security Diagram', updatedAt: '2 hours ago', views: 12 },
                { id: 2, title: 'Cloud Infrastructure', updatedAt: 'Yesterday', views: 45 },
                { id: 3, title: 'Database Schema', updatedAt: '3 days ago', views: 8 },
            ]);
            setSharedCanvases([
                { id: 4, title: 'Project Roadmap', owner: 'Alice', updatedAt: '5 hours ago' },
                { id: 5, title: 'UX Flowchart', owner: 'Bob', updatedAt: '2 days ago' },
            ]);
        }
    };

    const handleCreateCanvas = async () => {
        const title = prompt("Enter canvas title:");
        if (!title) return;

        try {
            const response = await fetch('http://localhost:5000/api/canvases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    ownerId: "65c3b9f8e4b0a2b3c4d5e6f7" // Dummy ID until auth is ready
                })
            });
            if (response.ok) {
                fetchCanvases();
            }
        } catch (err) {
            console.error('Error creating canvas:', err);
        }
    };

    const CanvasCard = ({ canvas, isShared = false }) => (
        <div className="canvas-card glass card-hover" onClick={() => console.log('Open canvas', canvas.id || canvas._id)}>
            <div className="canvas-preview">
                <Layout size={48} strokeWidth={1} color="var(--accent-color)" opacity={0.5} />
            </div>
            <div className="canvas-info">
                <div className="canvas-header">
                    <h3>{canvas.title}</h3>
                    <button className="icon-button"><MoreVertical size={16} /></button>
                </div>
                <div className="canvas-meta">
                    <div className="meta-item">
                        <Clock size={12} />
                        <span>{canvas.updatedAt || 'Just now'}</span>
                    </div>
                    {isShared ? (
                        <div className="meta-item">
                            <Users size={12} />
                            <span>{canvas.owner || canvas.ownerId?.name || 'You'}</span>
                        </div>
                    ) : (
                        <div className="meta-item">
                            <Users size={12} />
                            <span>{canvas.views || 0} views</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>My Canvases</h1>
                    <p className="subtitle">Manage and collaborate on your visual ideas</p>
                </div>
                <div className="header-right">
                    <div className="search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="Search canvases..." />
                    </div>
                    <button className="create-button" onClick={handleCreateCanvas}>
                        <PlusCircle size={20} />
                        <span>Create New</span>
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                {loading ? (
                    <div className="loading">Loading your canvases...</div>
                ) : (
                    <>
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2>Personal Canvases</h2>
                                <span className="count">{myCanvases.length}</span>
                            </div>
                            <div className="canvas-grid">
                                <div className="create-card glass card-hover" onClick={handleCreateCanvas}>
                                    <Plus size={40} strokeWidth={1} />
                                    <span>New Project</span>
                                </div>
                                {myCanvases.map(canvas => (
                                    <CanvasCard key={canvas.id || canvas._id} canvas={canvas} />
                                ))}
                            </div>
                        </section>

                        <section className="dashboard-section">
                            <div className="section-header">
                                <h2>Shared with Me</h2>
                                <span className="count">{sharedCanvases.length}</span>
                            </div>
                            <div className="canvas-grid">
                                {sharedCanvases.map(canvas => (
                                    <CanvasCard key={canvas.id || canvas._id} canvas={canvas} isShared />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
