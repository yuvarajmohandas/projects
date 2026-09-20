import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 mt-auto w-full">
      {/* Main Footer Links Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        
        {/* Column 1: Brand Info */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-bb-green text-white font-black text-md flex items-center justify-center shadow-sm">
              MK
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">MitraKart</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Your premium destination for fresh groceries, local farm produce, and organic daily essentials delivered right to your doorstep in Belgium.
          </p>
        </div>

        {/* Column 2: Quick Navigation Link Hooks */}
        <div>
          <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Shop Categories</h4>
          <ul className="space-y-2 text-xs font-medium">
            <li><Link to="/?category=fresh-vegetables" className="hover:text-bb-green transition-colors">Fresh Vegetables</Link></li>
            <li><Link to="/?category=rice-grains" className="hover:text-bb-green transition-colors">Rice & Grains</Link></li>
            <li><Link to="/?category=fresh-fruits" className="hover:text-bb-green transition-colors">Fresh Fruits</Link></li>
            <li><Link to="/?category=dairy-chilled" className="hover:text-bb-green transition-colors">Dairy & Chilled</Link></li>
          </ul>
        </div>

        {/* Column 3: Customer Care Shortcuts */}
        <div>
          <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Customer Service</h4>
          <ul className="space-y-2 text-xs font-medium">
            <li><Link to="/orders" className="hover:text-bb-green transition-colors">Track My Orders</Link></li>
            <li><Link to="/faq" className="hover:text-bb-green transition-colors">Frequently Asked Questions</Link></li>
            <li><Link to="/support" className="hover:text-bb-green transition-colors">Help & Support Helpdesk</Link></li>
            <li><Link to="/terms" className="hover:text-bb-green transition-colors">Return & Refund Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Local Contact & Trust Badges */}
        <div>
          <h4 className="text-white text-sm font-bold tracking-wider uppercase mb-4">Contact MitraKart</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex items-center gap-2">📍 <span>Brussels, Belgium</span></li>
            <li className="flex items-center gap-2">✉️ <span>support@mitrakart.be</span></li>
            <li className="flex items-center gap-2">⚡ <span>Delivery hours: 08:00 - 22:00</span></li>
          </ul>
        </div>

      </div>

      {/* Row 2: Bottom Copyright & Payment Badge strip */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} MitraKart Online Grocery. All rights reserved.</p>
          <div className="flex items-center gap-3 text-lg opacity-60">
            <span title="Visa">💳</span>
            <span title="Mastercard">🇪🇺</span>
            <span title="Bancontact">🇧🇪</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
