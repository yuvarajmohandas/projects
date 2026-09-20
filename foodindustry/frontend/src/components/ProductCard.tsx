import { useCart } from '../context/CartContext';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  categoryName: string;
}

export function ProductCard({ product, categoryName }: ProductCardProps) {
  const { addToCart, updateQty, removeFromCart, getCartQty } = useCart();

  const cartQty = getCartQty(product.id);
  const remaining = product.stockQty - cartQty;
  const atLimit = remaining <= 0;
  const outOfStock = product.stockQty <= 0;

  // BigBasket style discount badge arithmetic logic
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100) 
    : 0;

  function handleIncrement() {
    addToCart(product, 1);
  }

  function handleDecrement() {
    if (cartQty <= 1) removeFromCart(product.id);
    else updateQty(product.id, cartQty - 1);
  }

  // Find the top section wrapper inside your src/components/ProductCard.tsx and replace it:
return (
  <div className={`group relative border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden ${
    outOfStock ? 'opacity-60 bg-gray-50' : ''
  }`}>
    
    {/* PRODUCT IMAGE CONTAINER CONTAINER WITH CORNER OVERLAY BADGES */}
    <div className="relative bg-white group-hover:bg-gray-50/50 transition-colors p-4 flex items-center justify-center h-32 sm:h-36 border-b border-gray-50 overflow-hidden select-none">
      
      {/* ⚡ OPTION A: PREPARED MODERN FLOATING PILL BADGE }
      {hasDiscount && !outOfStock && (
        <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md z-10 animate-pulse">
          🔥 Save {discountPercentage}%
        </span>
      )*/}

      {/* 📐 OPTION B: DIAGONAL CORNER CORNER FOLD RIBBON (Alternative)
      If you prefer a true diagonal ribbon style, comment out option A above and uncomment this block:*/}
      {hasDiscount && !outOfStock && (
        <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden z-10 pointer-events-none">
          <div className="absolute top-3 -left-5 w-20 bg-red-600 text-white text-[9px] font-black text-center uppercase tracking-wide transform -rotate-45 shadow-sm py-0.5">
            -{discountPercentage}%
          </div>
        </div>
      )}
      

      {outOfStock && (
        <span className="absolute top-2.5 left-2.5 bg-gray-800 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm z-10">
          Sold Out
        </span>
      )}

      {/* Product Image rendering triggers */}
      {product.imageUrl ? (
        <img 
          src={product.imageUrl} 
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transform group-hover:scale-105 transition-transform duration-300 p-1"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fb = e.currentTarget.nextElementSibling as HTMLElement;
            if (fb) fb.style.display = 'block';
          }}
        />
      ) : null}

      <span 
        style={{ display: product.imageUrl ? 'none' : 'block' }}
        className="text-4xl sm:text-5xl transform group-hover:scale-110 transition-transform duration-300"
      >
        {product.imageEmoji}
      </span>
    </div>

      {/* Details layout description block */}
      <div className="p-3.5 flex flex-col flex-grow">
        {categoryName && (
          <span className="text-[10px] text-bb-green-darker font-bold uppercase tracking-wider bg-bb-green-light/40 px-2 py-0.5 rounded-md self-start">
            {categoryName}
          </span>
        )}
        
        <h4 className="font-bold text-sm text-gray-900 leading-snug tracking-tight mt-2 min-h-[2.5rem] line-clamp-2 group-hover:text-bb-green transition-colors">
          {product.name}
        </h4>
        
        <p className="text-xs text-gray-400 font-medium mt-1">{product.unit}</p>

        {/* Pricing and Actions Row */}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-gray-50/60">
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
              <span className="text-gray-900 font-black text-base tracking-tight">
                €{product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through font-medium">
                  €{product.oldPrice?.toFixed(2)}
                </span>
              )}
            </div>

            <span className={`text-[10px] font-medium mt-0.5 ${remaining < 5 && !outOfStock ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
              {outOfStock ? 'Out of stock' : remaining <= 3 ? `Only ${remaining} left!` : `${product.stockQty} in stock`}
            </span>
          </div>

          {/* Quantity Controls Toggle */}
          {cartQty > 0 ? (
            <div className="flex items-center bg-bb-green rounded-full text-white text-sm font-black shadow-sm overflow-hidden h-8">
              <button onClick={handleDecrement} className="w-8 h-8 flex items-center justify-center hover:bg-bb-green-dark transition-colors">−</button>
              <span className="min-w-[1.25rem] text-center font-bold px-0.5">{cartQty}</span>
              <button onClick={handleIncrement} disabled={atLimit} className="w-8 h-8 flex items-center justify-center hover:bg-bb-green-dark transition-colors disabled:opacity-40">+</button>
            </div>
          ) : (
            <button
              disabled={outOfStock}
              onClick={handleIncrement}
              className={`h-8 px-4 rounded-full text-xs font-black border transition-all shadow-sm ${
                !outOfStock
                  ? 'text-bb-green-darker border-bb-green bg-bb-green-light hover:bg-bb-green hover:text-white transform active:scale-95'
                  : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
