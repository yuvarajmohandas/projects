// components.js
const React = window.React;

// 1. Navigation Bar Component
export function Header({ currentView, setView }) {
    return (
        <header class="bg-indigo-900 text-white shadow-md px-6 py-4 flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <span class="text-2xl">🇧🇪</span>
                <h1 class="text-xl font-bold tracking-tight">BelgoIndic Grocery</h1>
            </div>
            <div class="flex space-x-2 bg-indigo-800 p-1 rounded-lg">
                <button 
                    onClick={() => setView('customer')} 
                    class={`px-4 py-2 rounded-md font-medium text-sm transition ${currentView === 'customer' ? 'bg-white text-indigo-900 shadow' : 'text-indigo-200 hover:text-white'}`}>
                    🛒 Customer View
                </button>
                <button 
                    onClick={() => setView('vendor')} 
                    class={`px-4 py-2 rounded-md font-medium text-sm transition ${currentView === 'vendor' ? 'bg-white text-indigo-900 shadow' : 'text-indigo-200 hover:text-white'}`}>
                    🏪 Vendor Dashboard
                </button>
            </div>
        </header>
    );
}

// 2. Customer Shopping Component
export function CustomerView({ products, addToCart, cart, removeFromCart, checkout, deliveryFee }) {
    const storeIds = [...new Set(products.map(p => p.storeId))];
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <h2 class="text-2xl font-bold mb-6 text-gray-900">Browse Partner Stores in Belgium</h2>
                {storeIds.map(storeId => {
                    const storeProducts = products.filter(p => p.storeId === storeId);
                    return (
                        <div key={storeId} class="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 class="text-lg font-semibold text-indigo-700 mb-4">📍 {storeProducts[0]?.storeName}</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {storeProducts.map(product => (
                                    <div key={product.id} class={`border rounded-xl p-4 flex flex-col justify-between ${!product.inStock ? 'opacity-50 bg-gray-50' : 'bg-white'}`}>
                                        <div>
                                            <div class="text-3xl mb-2">{product.image}</div>
                                            <h4 class="font-medium text-sm text-gray-900">{product.name}</h4>
                                            <p class="text-indigo-600 font-bold mt-1">€{product.price.toFixed(2)}</p>
                                        </div>
                                        <button disabled={!product.inStock} onClick={() => addToCart(product)} class={`w-full mt-4 py-2 rounded-lg text-xs font-semibold text-white ${product.inStock ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                                            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div>
                <div class="bg-white p-6 rounded-xl shadow-sm border sticky top-6">
                    <h2 class="text-xl font-bold mb-4">Your Basket</h2>
                    {cart.length === 0 ? <p class="text-gray-400 text-sm text-center py-8">Your cart is empty.</p> : (
                        <div>
                            {cart.map(item => (
                                <div key={item.id} class="py-2 flex justify-between text-sm">
                                    <div>{item.name} ({item.qty}x)</div>
                                    <button onClick={() => removeFromCart(item.id)} class="text-red-500 text-xs">Remove</button>
                                </div>
                            ))}
                            <div class="border-t mt-4 pt-4 space-y-2 text-sm">
                                <div class="flex justify-between"><span>Subtotal:</span><span>€{cartSubtotal.toFixed(2)}</span></div>
                                <div class="flex justify-between"><span>Delivery:</span><span>€{deliveryFee.toFixed(2)}</span></div>
                                <div class="flex justify-between font-bold text-base border-t pt-2"><span>Total:</span><span>€{(cartSubtotal + deliveryFee).toFixed(2)}</span></div>
                            </div>
                            <button onClick={checkout} class="w-full mt-6 bg-green-600 text-white font-bold py-3 rounded-xl text-sm">Place Order</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 3. Vendor Dashboard Component
export function VendorView({ products, toggleStock, orders }) {
    return (
        <div class="space-y-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 class="text-lg font-bold mb-4">Live Inventory Control</h3>
                    {products.map(p => (
                        <div key={p.id} class="py-3 flex justify-between items-center border-b last:border-0">
                            <div><p class="font-medium text-sm">{p.name}</p><p class="text-xs text-gray-400">{p.storeName}</p></div>
                            <button onClick={() => toggleStock(p.id)} class={`px-3 py-1 rounded-lg text-xs font-bold ${p.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                        </div>
                    ))}
                </div>
                <div class="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 class="text-lg font-bold mb-4">Platform Sales Split Ledger</h3>
                    {orders.length === 0 ? <p class="text-gray-400 text-sm">No orders yet.</p> : orders.map(order => (
                        <div key={order.id} class="border p-4 rounded-xl bg-gray-50 mb-3 text-xs space-y-2">
                            <div class="flex justify-between font-bold"><span>ID: {order.id}</span><span>Time: {order.date}</span></div>
                            <div class="bg-white p-3 rounded border text-gray-600 space-y-1">
                                <div class="font-bold text-emerald-700">Platform Commission (12%): +€{order.commission.toFixed(2)}</div>
                                {order.splits.map(s => <div key={s.storeId}>{s.storeName} Split: +€{s.payout.toFixed(2)}</div>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
