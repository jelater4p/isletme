import React, { useState, useEffect } from 'react';
import '../styles/menu.css';
import MenuCard from '../components/MenuCard';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function MenuPage() {
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState('Tümü');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();

        // Realtime Subscription
        const channel = supabase
            .channel('public:products')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
                setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['Tümü', ...new Set(products.map(p => p.category))];

    const filteredProducts = category === 'Tümü'
        ? products
        : products.filter(p => p.category === category);

    if (loading) {
        return (
            <div className="container menu-page" style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Simple Skeleton Loader */}
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: '120px', background: '#f0f0f0', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
                ))}
            </div>
        );
    }

    return (
        <div className="container menu-page">
            <header style={{ padding: 'var(--spacing-md) 0' }}>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}
                >
                    Menu
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Hoşgeldiniz, lezzetli seçenekler sizi bekliyor.
                </motion.p>
            </header>

            <nav className="category-nav">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-btn ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                    >
                        {cat}
                        {category === cat && (
                            <motion.div
                                layoutId="activeCategory"
                                className="active-indicator"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </nav>

            <motion.div layout className="menu-grid">
                <AnimatePresence mode='popLayout'>
                    {filteredProducts.map(product => (
                        <MenuCard key={product.id} product={product} />
                    ))}
                </AnimatePresence>

                {filteredProducts.length === 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}
                    >
                        Bu kategoride ürün bulunamadı.
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
}
