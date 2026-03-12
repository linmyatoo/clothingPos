'use client';

import React from 'react';

function ProductCard({ product, onSelectVariant }) {
    const [selectedVariant, setSelectedVariant] = React.useState(null);

    const handleVariantSelect = (variant) => {
        setSelectedVariant(variant);
    };

    const handleAddToCart = () => {
        if (!selectedVariant) return;
        onSelectVariant(product, selectedVariant);
        setSelectedVariant(null);
    };

    const variants = product.variants
        ? (typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants)
        : [];

    const availableVariants = variants.filter((v) => v.stock_quantity > 0);

    return (
        <div className="product-card">
            <div className="product-card-category">{product.category}</div>
            <h3 className="product-card-name">{product.name}</h3>
            <p className="product-card-brand">{product.brand || '—'}</p>

            {availableVariants.length > 0 ? (
                <>
                    <div className="variant-grid">
                        {availableVariants.map((v) => (
                            <button
                                key={v.id}
                                className={`variant-btn ${selectedVariant?.id === v.id ? 'selected' : ''}`}
                                onClick={() => handleVariantSelect(v)}
                                title={`${v.color} - Stock: ${v.stock_quantity}`}
                            >
                                <span>{v.size}</span>
                                <small>{v.color}</small>
                            </button>
                        ))}
                    </div>

                    {selectedVariant && (
                        <div className="selected-variant-info">
                            <span className="variant-price">
                                ${parseFloat(selectedVariant.selling_price).toFixed(2)}
                            </span>
                            <span className="variant-stock">Stock: {selectedVariant.stock_quantity}</span>
                        </div>
                    )}

                    <button
                        className={`add-to-cart-btn ${!selectedVariant ? 'disabled' : ''}`}
                        onClick={handleAddToCart}
                        disabled={!selectedVariant}
                    >
                        + Add to Cart
                    </button>
                </>
            ) : (
                <div className="out-of-stock">Out of Stock</div>
            )}
        </div>
    );
}

export default ProductCard;
