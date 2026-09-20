import { useEffect, useState, useRef } from 'react';
import type { Category } from '../../types';

interface CategoryMenuProps {
  categories: Category[];
  onCategoryClick: (name: string) => void;
}

export function CategoryMenu({ categories, onCategoryClick }: CategoryMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative z-30">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 transition shadow-sm">
        <span>Shop by Category</span>
        <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && categories.length > 0 && (
        <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
          {categories.map((cat) => (
            <button key={cat.id} type="button" onClick={() => { setIsOpen(false); onCategoryClick(cat.name); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-bb-green-light hover:text-bb-green-darker font-medium transition-colors">
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
