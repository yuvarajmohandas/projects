import type { Category } from '../types';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (name: string) => void; // Changed type definition from id to name
}

export function CategoryBar({ categories, selectedCategory, onSelectCategory }: CategoryBarProps) {
  return (
    <div className="w-full overflow-x-auto whitespace-nowrap py-2 -my-2 flex items-center gap-2 no-scrollbar">
      <button
        onClick={() => onSelectCategory('')}
        className={`px-5 py-2 rounded-full text-xs font-bold border transition-all ${
          selectedCategory === ''
            ? 'bg-bb-green text-white border-bb-green shadow-sm'
            : 'bg-white text-gray-600 border-gray-200 hover:border-bb-green hover:text-bb-green-darker shadow-sm'
        }`}
      >
        All Items
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelectCategory(c.name)} // Changed from c.id to c.name
          className={`px-5 py-2 rounded-full text-xs font-bold border transition-all ${
            selectedCategory === c.name // Changed comparison from c.id to c.name
              ? 'bg-bb-green text-white border-bb-green shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-bb-green hover:text-bb-green-darker shadow-sm'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
