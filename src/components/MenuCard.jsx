import React from 'react';
import { getProductImage } from '../utils/imageHelpers';
import { motion } from 'framer-motion';

const MenuCard = ({ product }) => {
    const isOutOfStock = product.stock <= 0;
    const imageUrl = getProductImage(product);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`menu-card ${isOutOfStock ? 'opacity-70' : ''}`}
            style={{ opacity: isOutOfStock ? 0.6 : 1 }}
        >
            <div className="card-media">
                <img src={imageUrl} alt={product.name} loading="lazy" />
            </div>

            <div className="card-content">
                <div className="product-info">
                    <h3>{product.name}</h3>
                    <span className="price">{Number(product.price).toLocaleString('tr-TR')} ₺</span>
                </div>

                <div className="status-area">
                    {isOutOfStock ? (
                        <span className="stock-status stock-out">Tükendi</span>
                    ) : (
                        <span className="stock-status stock-available">
                            {product.stock} adet
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MenuCard;
