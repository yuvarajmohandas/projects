import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { PromoBanner } from '../components/PromoBanner';
import { ProductCard } from '../components/ProductCard';
import type { Category, HomepageLayout, Product } from '../types';

interface GroupedSection extends Category {
  items: Product[];
}

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homepage, setHomepage] = useState<HomepageLayout | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryName = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    api.get<HomepageLayout>('/homepage').then(setHomepage).catch(() => undefined);
    api.get<{ categories: Category[] }>('/categories').then((res) => setCategories(res.categories)).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ products: Product[] }>('/products')
      .then((res) => setProducts(res.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleCategorySelect(name: string) {
    setSearchParams((prev) => {
      if (!name) prev.delete('category');
      else prev.set('category', name);
      return prev;
    });
  }

  // Filter out top high-impact discount deals items
  const topOffersItems = useMemo(() => {
    return products.filter((p: Product) => p.oldPrice && p.oldPrice > p.price);
  }, [products]);

  // AUTOMATED COMPARTMENT GROUPING & SEARCH FILTERING LOGIC
  const structuredSections = useMemo<GroupedSection[]>(() => {
    const filteredList = products.filter((product: Product) => {
      return !search || product.name.toLowerCase().includes(search.toLowerCase());
    });

    return categories
      .map((category: Category) => {
        const categoryProducts = filteredList.filter((p: Product) => p.categoryId === category.id);
        return { ...category, items: categoryProducts };
      })
      .filter((section: GroupedSection) => {
        const matchesPillSelection = !selectedCategoryName || section.name.toLowerCase() === selectedCategoryName.toLowerCase();
        return matchesPillSelection && section.items.length > 0;
      });
  }, [products, categories, selectedCategoryName, search]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* 1. Promotional Auto-Rotating Carousel Banner */}
      <PromoBanner homepage={homepage} />

      {/* 2. DYNAMIC HOMEPAGE SECTIONS RESOLUTION LAYER LOOP (Fixes Image and Text) */}
      {!search && !selectedCategoryName && homepage?.sections.filter(s => s.isActive).map((section) => {
        // Parse section configuration details safely
       // const content = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;

        // 🌟 UPDATED: Fully interactive layout orientation compiler module inside CatalogPage.tsx
if (section.type === 'image-text') {
  let contentData: any = {};
  try {
    contentData = typeof section.content === 'string' ? JSON.parse(section.content) : section.content;
  } catch (e) {
    contentData = section.content || {};
  }

  const titleText = contentData.title || '';
  const descText = contentData.description || '';
  const btnText = contentData.buttonText || '';
  const btnLink = contentData.buttonLink || '';
  const bannerUrl = contentData.imageUrl || '';
  
  // 🌟 READ THE SELECTED ALIGNMENT PROP (Defaults to LEFT if not specified)
  const layoutAlign = contentData.textAlignment || 'LEFT'; 
  const hasTextContent = titleText.trim() || descText.trim() || btnText.trim();

  // Determine flexible positioning rules based on your dropdown selection
  const flexOrderText = layoutAlign === 'RIGHT' ? 'order-2 md:text-left' : layoutAlign === 'CENTER' ? 'order-2 text-center md:col-span-2' : 'order-2 md:order-1';
  const flexOrderImage = layoutAlign === 'RIGHT' ? 'order-1' : layoutAlign === 'CENTER' ? 'order-1 md:col-span-2 h-44 sm:h-56' : 'order-1 md:order-2';
  const gridColumnsLayout = layoutAlign === 'CENTER' ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6';

  return (
    <div key={section.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in w-full min-h-[12rem]">
      {hasTextContent ? (
        <div className={`grid ${gridColumnsLayout} items-center p-6 w-full`}>
          
          {/* 📝 DYNAMIC TEXT STACK */}
          <div className={`space-y-3 ${flexOrderText}`}>
            {titleText && <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">{titleText}</h3>}
            {descText && <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed max-w-xl mx-auto">{descText}</p>}
            {btnText && btnLink && (
              <Link to={btnLink} className="inline-block rounded-full bg-bb-green hover:bg-bb-green-dark px-5 py-2 text-xs font-bold text-white shadow-sm transition-all transform hover:scale-[1.02]">
                {btnText}
              </Link>
            )}
          </div>

          {/* 🖼️ DYNAMIC IMAGE COVER ASSET CONTAINER */}
          {bannerUrl && (
            <div className={`rounded-xl overflow-hidden h-40 sm:h-48 w-full shadow-inner bg-gray-50 ${flexOrderImage}`}>
              <img src={bannerUrl} alt="" className="w-full h-full object-cover object-center" />
            </div>
          )}

        </div>
      ) : (
        /* Full Width Stretch variant remains unchanged */
        bannerUrl && (
          <div className="w-full h-32 sm:h-44 md:h-52 lg:h-60">
            <img src={bannerUrl} alt="" className="w-full h-full object-cover object-center transform hover:scale-[1.005] transition-all" />
          </div>
        )
      )}
    </div>
  );
}



        // Space fallbacks handler
        if (section.type === 'spacer') {
          return <div key={section.id} className="h-2" />;
        }

        return null;
      })}

      {/* 3. COMPACT TOP SAVE OFFERS BAR ROW */}
      {!search && !selectedCategoryName && topOffersItems.length > 0 && (
        <div className="space-y-4 bg-orange-50/40 border border-orange-100 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-orange-100/60 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h3 className="text-base font-black text-orange-800 tracking-tight">Top Offers & Deals</h3>
              <span className="bg-orange-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse">Save Big</span>
            </div>
            <Link to="/offers" className="text-xs font-black text-orange-600 hover:text-orange-700 hover:underline">View All Deals →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topOffersItems.slice(0, 5).map((product: Product) => (
              <ProductCard key={product.id} product={product} categoryName="On Sale" />
            ))}
          </div>
        </div>
      )}

      {/* error state banner logs */}
      {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">⚠️ {error}</div>}

      {/* 4. MAIN GROCERIES DEPARTMENTS BROWSING SECTIONS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="w-8 h-8 border-4 border-bb-green border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm font-semibold tracking-wide">Loading fresh products...</p>
        </div>
      ) : structuredSections.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <span className="text-4xl">📦</span>
          <p className="text-gray-500 font-bold mt-3 text-sm">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {structuredSections.map((section: GroupedSection) => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{section.name}</h3>
                  <span className="text-xs text-gray-400 font-bold">({section.items.length} {section.items.length === 1 ? 'item' : 'items'})</span>
                </div>
                {!selectedCategoryName && (
                  <button onClick={() => handleCategorySelect(section.name)} className="text-xs font-black text-bb-green hover:text-bb-green-dark transition-colors">See All →</button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {section.items.map((product: Product) => (
                  <ProductCard key={product.id} product={product} categoryName="" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
