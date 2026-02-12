import React from 'react';
import authService from '../../../services/authService';

const LogoutButton = ({ className }) => {
    const handleLogout = () => {
        authService.logout();
    };

    return (
        <button
            onClick={handleLogout}
            className={className}
        >
            Logout
        </button>
    );
};

export default LogoutButton;
