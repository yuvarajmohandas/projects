import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function HeaderSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlSearchValue = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(urlSearchValue);

  useEffect(() => { setLocalSearch(urlSearchValue); }, [urlSearchValue]);

  useEffect(() => {
    if (localSearch === urlSearchValue) return;
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        if (!localSearch) prev.delete('search');
        else prev.set('search', localSearch);
        return prev;
      });
      if (window.location.pathname !== '/') navigate(`/?search=${encodeURIComponent(localSearch)}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchParams, navigate, urlSearchValue]);

  return (
    <div className="relative flex-1 max-w-xl mx-2">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>🔍</span>
      <input
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Search for over 5,000 products..."
        className="w-full border border-gray-200 rounded-full pl-10 pr-10 py-2 text-sm bg-gray-50 shadow-inner focus:outline-none focus:ring-2 focus:ring-bb-green focus:bg-white transition-all"
      />
      {localSearch && (
        <button
          type="button"
          onClick={() => { setLocalSearch(''); setSearchParams((prev) => { prev.delete('search'); return prev; }); if (window.location.pathname !== '/') navigate('/'); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm bg-gray-200 hover:bg-gray-300 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
        >✕</button>
      )}
    </div>
  );
}
