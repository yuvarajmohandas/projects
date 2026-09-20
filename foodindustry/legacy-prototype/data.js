// data.js
export const INITIAL_PRODUCTS = [
    { id: 1, storeId: 'S1', storeName: 'Namaste Bazaar (Brussels)', name: 'Premium Basmati Rice 5kg', price: 14.99, image: '🌾', inStock: true },
    { id: 2, storeId: 'S1', storeName: 'Namaste Bazaar (Brussels)', name: 'Garam Masala 200g', price: 3.49, image: '🌶️', inStock: true },
    { id: 3, storeId: 'S1', storeName: 'Namaste Bazaar (Brussels)', name: 'Toor Dal 1kg', price: 4.25, image: '🫘', inStock: true },
    { id: 4, storeId: 'S2', storeName: 'Spices & More (Antwerp)', name: 'Alphonso Mangoes (Box)', price: 18.00, image: '🥭', inStock: true },
    { id: 5, storeId: 'S2', storeName: 'Spices & More (Antwerp)', name: 'Paneer 400g', price: 5.99, image: '🧀', inStock: true },
    { id: 6, storeId: 'S2', storeName: 'Spices & More (Antwerp)', name: 'Fresh Curry Leaves', price: 1.50, image: '🍃', inStock: true },
];

export const PLATFORM_SETTINGS = {
    COMMISSION_RATE: 0.12, // Your 12% fee cut on grocery items
    DELIVERY_FEE: 4.99     // Average Belgian local shipping cost
};
