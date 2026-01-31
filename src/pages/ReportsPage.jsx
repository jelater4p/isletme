import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import '../styles/panel.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [period, setPeriod] = useState('today'); // 'today', 'week', 'month'
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ name: '', amount: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchReport(period);
    }, [period]);

    const fetchReport = async (selectedPeriod) => {
        setLoading(true);

        const now = new Date();
        let startDate = new Date();

        if (selectedPeriod === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (selectedPeriod === 'week') {
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
            startDate.setDate(diff);
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }

        try {
            // 1. Fetch Sales Report
            const { data: salesData, error: salesError } = await supabase.rpc('get_sales_report', {
                start_date: startDate.toISOString(),
                end_date: now.toISOString()
            });
            if (salesError) throw salesError;
            setReportData(salesData || []);

            // 2. Fetch Expenses
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', now.toISOString());

            if (expenseError) throw expenseError;
            setExpenses(expenseData || []);

        } catch (error) {
            console.error('Rapor hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.name || !newExpense.amount) return;

        try {
            const { error } = await supabase.from('expenses').insert([{
                name: newExpense.name,
                amount: parseFloat(newExpense.amount)
            }]);

            if (error) throw error;

            // Reset and refetch
            setNewExpense({ name: '', amount: '' });
            setShowModal(false);
            fetchReport(period);
            alert('Gider eklendi.');
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    // Calculate Totals
    const totalRevenue = reportData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalGrossProfit = reportData.reduce((acc, curr) => acc + (curr.profit || 0), 0);
    const totalItems = reportData.reduce((acc, curr) => acc + curr.quantity_sold, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netOperatingProfit = totalGrossProfit - totalExpenses;

    // --- Chart Data Preparation ---
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // 1. Top Selling Products (Pie Chart)
    const topProductsData = [...reportData]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(item => ({
            name: item.product_name,
            value: item.revenue
        }));

    // 2. Category Performance (Bar Chart)
    const categoryDataMap = reportData.reduce((acc, curr) => {
        if (!acc[curr.category]) {
            acc[curr.category] = { name: curr.category, revenue: 0 };
        }
        acc[curr.category].revenue += curr.revenue;
        return acc;
    }, {});
    const categoryData = Object.values(categoryDataMap).sort((a, b) => b.revenue - a.revenue);

    return (
        <div className="container panel-page">
            {/* Header */}
            <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/panel')}
                        style={{ background: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', padding: '0' }}
                    >
                        ←
                    </button>
                    <h1>Finansal Raporlar</h1>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.2rem', marginRight: '1rem' }}>
                        <button className={`category-btn ${period === 'today' ? 'active' : ''}`} onClick={() => setPeriod('today')}>Bugün</button>
                        <button className={`category-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>Bu Hafta</button>
                        <button className={`category-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Bu Ay</button>
                    </div>

                    <button
                        className="category-btn"
                        style={{ background: '#d32f2f', color: 'white', borderColor: '#d32f2f', marginLeft: 'auto' }}
                        onClick={() => setShowModal(true)}
                    >
                        - Gider Ekle
                    </button>
                </div>
            </div>

            {/* Expense Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', width: '300px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Gider Ekle</h3>
                        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Gider Adı (Örn: Elektrik)"
                                value={newExpense.name}
                                onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Tutar (TL)"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                required
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.8rem', background: '#f1f3f5', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>İptal</button>
                                <button type="submit" style={{ flex: 1, padding: '0.8rem', background: '#d32f2f', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="stock-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stock-card" style={{ background: 'var(--primary-color)', color: 'white', border: 'none' }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Toplam Ciro</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem' }}>
                        {totalRevenue.toLocaleString('tr-TR')} ₺
                    </div>
                </div>

                <div className="stock-card" style={{ background: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2' }}>
                    <h3>Toplam Gider</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem' }}>
                        - {totalExpenses.toLocaleString('tr-TR')} ₺
                    </div>
                </div>

                <div className="stock-card" style={{ background: 'var(--success-color)', color: 'white', border: 'none' }}>
                    <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>NET İŞLETME KÂRI</h3>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '0.5rem' }}>
                        {netOperatingProfit.toLocaleString('tr-TR')} ₺
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            {reportData.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

                    {/* Pie Chart: Top Products */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', minHeight: '350px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>En Çok Satan 5 Ürün (Ciro)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={topProductsData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {topProductsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value.toLocaleString('tr-TR')} ₺`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart: Category Performance */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', minHeight: '350px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Kategori Performansı</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `${value.toLocaleString('tr-TR')} ₺`} />
                                <Legend />
                                <Bar dataKey="revenue" name="Ciro" fill="#ffc658" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detailed Table */}
            <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                <h3 style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.02)', margin: 0 }}>Satış Detayları</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--card-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Ürün</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Kategori</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center' }}>Adet</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Ciro</th>
                            <th style={{ padding: '1rem', color: 'var(--success-color)', fontWeight: '600', textAlign: 'right' }}>Ürün Kârı</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Hesaplanıyor...</td></tr>
                        ) : reportData.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Bu periyotta satış yok.</td></tr>
                        ) : (
                            reportData.map((row, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{row.product_name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row.category}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>{row.quantity_sold}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                                        {row.revenue.toLocaleString('tr-TR')} ₺
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success-color)', fontWeight: '700' }}>
                                        {(row.profit || 0).toLocaleString('tr-TR')} ₺
                                    </td>
                                </tr>
                            ))
                        )}
                        {/* Empty state or unexpected format fallback */}
                        {reportData.length > 0 && !reportData[0].profit && reportData[0].profit !== 0 && (
                            <tr><td colSpan="5" style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'red', textAlign: 'center' }}>
                                (Not: Kâr verisi görünmüyorsa SQL güncellemesini yapmanız gerekmektedir.)
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Expense List */}
            {expenses.length > 0 && (
                <div style={{ marginTop: '2rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
                    <h3 style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', background: 'rgba(255,0,0,0.05)', color: '#d32f2f', margin: 0 }}>Gider Dökümü</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <tbody>
                            {expenses.map(exp => (
                                <tr key={exp.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                    <td style={{ padding: '1rem' }}>{exp.name}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#d32f2f' }}>
                                        - {exp.amount.toLocaleString('tr-TR')} ₺
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
