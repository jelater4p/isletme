import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Coffee, LogOut, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Panel', path: '/panel' },
        { icon: BarChart3, label: 'Raporlar', path: '/reports' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">☕</div>
                <h2 className="logo-text">Cafe Admin</h2>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <a
                    href="/menu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-item"
                    style={{ marginTop: 'auto' }}
                >
                    <Coffee size={20} />
                    <span>Menü Önizle</span>
                    <ExternalLink size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </a>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button">
                    <LogOut size={18} />
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </aside>
    );
}
