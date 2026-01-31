import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const StockCard = ({ product, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const handleTransaction = async (type) => {
        if (loading) return;
        setLoading(true);

        const delta = type === 'sale' ? -quantity : quantity;

        try {
            await onUpdate(product.id, delta);
            setQuantity(1);
        } catch (error) {
            alert('İşlem başarısız: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`stock-card ${loading ? 'loading-overlay' : ''}`}>
            <header>
                <div>
                    <h3>{product.name}</h3>
                    <span className="category-tag">{product.category}</span>
                </div>
                <div className="stock-display">
                    <span>{product.stock}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>adet</span>
                </div>
            </header>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--card-border)',
                        color: 'white',
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}
                />
            </div>

            <div className="controls">
                <button
                    className="btn-action btn-sell"
                    onClick={() => handleTransaction('sale')}
                    disabled={loading || product.stock < quantity}
                >
                    SATILDI
                </button>
                <button
                    className="btn-action btn-return"
                    onClick={() => handleTransaction('return')}
                    disabled={loading}
                >
                    İADE
                </button>
            </div>
        </div>
    );
};

export default StockCard;
