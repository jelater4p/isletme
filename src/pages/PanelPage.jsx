import React, { useState, useEffect } from 'react';
import '../styles/panel.css';
import StockCard from '../components/StockCard';

import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function PanelPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [dailyStats, setDailyStats] = useState({ revenue: 0, profit: 0 }); // New State
    const navigate = useNavigate();

    useEffect(() => {
        // Auth Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login', { replace: true });
                return;
            }
            setSession(session);
            fetchProducts();
            fetchDailyStats(); // Fetch daily stats
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    const fetchDailyStats = async () => {
        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        try {
            // 1. Sales
            const { data: salesData, error: salesError } = await supabase.rpc('get_sales_report', {
                start_date: startOfDay.toISOString(),
                end_date: now.toISOString()
            });

            // 2. Expenses
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .select('amount')
                .gte('created_at', startOfDay.toISOString());

            if (!salesError && !expenseError) {
                const totalRevenue = (salesData || []).reduce((acc, curr) => acc + curr.revenue, 0);
                const totalGrossProfit = (salesData || []).reduce((acc, curr) => acc + (curr.profit || 0), 0);
                const totalExpenses = (expenseData || []).reduce((acc, curr) => acc + curr.amount, 0);

                setDailyStats({
                    revenue: totalRevenue,
                    profit: totalGrossProfit - totalExpenses
                });
            }
        } catch (error) {
            console.error('Error fetching daily stats', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('category')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Ürünler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleStockUpdate = async (id, delta) => {
        // Optimistic Update
        const previousProducts = [...products];
        setProducts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, stock: p.stock + delta };
            }
            return p;
        }));

        try {
            const { error } = await supabase.rpc('update_stock', { p_id: id, quantity: delta });
            if (error) throw error;

            // Update daily stats optimistically if it's a sale
            if (delta < 0) {
                // Re-fetch to be accurate or implement complex optimistic logic. Re-fetch is safer.
                fetchDailyStats();
            }

        } catch (error) {
            toast.error('Hata: ' + error.message);
            // Rollback
            setProducts(previousProducts);
        }
    };

    // Dashboard Calculations
    const totalProducts = products.length;
    const criticalStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock <= 0).length;

    const categories = [...new Set(products.map(p => p.category))];

    if (loading) return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ height: '100px', flex: 1, background: '#eee', borderRadius: '8px' }}></div>
                <div style={{ height: '100px', flex: 1, background: '#eee', borderRadius: '8px' }}></div>
                <div style={{ height: '100px', flex: 1, background: '#eee', borderRadius: '8px' }}></div>
            </div>
            <div style={{ height: '300px', background: '#f9f9f9', borderRadius: '8px' }}></div>
        </div>
    );

    return (
        <div className="container panel-page">
            <Toaster position="top-right" />

            <div className="panel-header">
                <div>
                    <h1>Yönetim Paneli</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hoşgeldiniz, {session?.user.email}</p>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button className="logout-btn" onClick={() => navigate('/reports')} style={{ background: 'white', color: 'var(--text-color)', border: '1px solid var(--card-border)' }}>
                        📊 Raporlar
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        Çıkış Yap
                    </button>
                </div>
            </div>

            {/* Smart Summary Card (End of Day) */}
            <div style={{
                background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                boxShadow: '0 4px 15px rgba(30, 136, 229, 0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, opacity: 0.9 }}>Gün Sonu Özeti</h2>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>Bugün</span>
                </div>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.5' }}>
                    Bugün toplam <strong style={{ fontSize: '1.3rem' }}>{dailyStats.revenue.toLocaleString('tr-TR')} ₺</strong> ciro yaptın.
                    Net kârın: <strong style={{ color: '#a5d6a7', fontSize: '1.3rem' }}>{dailyStats.profit.toLocaleString('tr-TR')} ₺</strong>.
                    {dailyStats.profit > 0 ? 'Harika gidiyor! 🚀' : 'Henüz günün başındayız.'}
                </div>
            </div>

            {/* Dashboard Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="dashboard-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Toplam Ürün</span>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>{totalProducts}</span>
                </div>
                <div className="dashboard-card" style={{ background: '#fff3cd', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffeeba', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#856404' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Kritik Stok</span>
                    <span style={{ fontSize: '2rem', fontWeight: '700' }}>{criticalStockCount}</span>
                </div>
                <div className="dashboard-card" style={{ background: '#ffebee', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffcdd2', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#c62828' }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Tükenenler</span>
                    <span style={{ fontSize: '2rem', fontWeight: '700' }}>{outOfStockCount}</span>
                </div>
            </div>

            {products.length === 0 && <p>Henüz ürün eklenmemiş.</p>}

            {categories.map(cat => (
                <section key={cat} style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{
                        marginBottom: '1rem',
                        fontSize: '1.2rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        borderBottom: '1px solid var(--card-border)',
                        paddingBottom: '0.5rem'
                    }}>
                        {cat}
                    </h2>
                    <div className="stock-grid">
                        {products.filter(p => p.category === cat).map(product => (
                            <StockCard
                                key={product.id}
                                product={product}
                                onUpdate={handleStockUpdate}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
