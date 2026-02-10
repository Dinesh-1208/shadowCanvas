import React from "react";
import "../../../styles/auth.css";

const AuthCard = ({ title, subtitle, children, footer }) => {
    return (
        <div className="auth-card">
            <div className="card-header">
                <h2 className="card-title">{title}</h2>
                <p className="card-subtitle">{subtitle}</p>
            </div>
            {children}
            {footer && <div className="auth-footer">{footer}</div>}
        </div>
    );
};

export default AuthCard;
