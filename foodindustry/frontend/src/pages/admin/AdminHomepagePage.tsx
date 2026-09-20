import { useEffect, useState, type DragEvent, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import { HomepageSectionCard } from './components/HomepageSectionCard';
import type { HomepageLayout, HomepageSection, HomepageSectionType } from '../../types';

const defaultLayout: HomepageLayout = {
  // ✅ Inserted 'search' into the default sequence list array
  header: { order: ['logo', 'name', 'search', 'navigation', 'cart'], alignment: 'left' },
  sections: [],
};

const sectionLabels: Record<HomepageSectionType, string> = {
  hero: 'Hero banner',
  'image-text': 'Image and text',
  categories: 'Categories',
  products: 'Featured products',
  spacer: 'Spacer',
};

const headerLabels: Record<string, string> = {
  logo: 'Logo icon',
  name: 'Website name (MitraKart)',
  search: '🔍 Central Search Input Bar', // 🌟 ADDED SEARCH CHIP CAPSUlE
  navigation: 'Admin / Login portals links',
  cart: 'Basket / Cart checkout count',
};

function createSection(type: HomepageSectionType, sortOrder: number): HomepageSection {
  return {
    id: `new-${crypto.randomUUID()}`,
    type,
    sortOrder,
    isActive: true,
    content: type === 'spacer' ? {} : { title: type === 'hero' ? 'Fresh groceries delivered' : '' },
  };
}

export function AdminHomepagePage() {
  const [layout, setLayout] = useState<HomepageLayout>(defaultLayout);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HomepageLayout>('/homepage')
      .then((fetchedLayout) => {
        // 🛡️ FRONTEND RECOVERY FALLBACK: If the backend database doesn't know about 'search' yet,
        // explicitly inject it into the local state so the draggable capsule chip pill displays!
        if (fetchedLayout.header && fetchedLayout.header.order && !fetchedLayout.header.order.includes('search')) {
          const structuralOrder = [...fetchedLayout.header.order];
          const logoIndex = structuralOrder.indexOf('logo');

          if (logoIndex !== -1) {
            structuralOrder.splice(logoIndex + 1, 0, 'search'); // Placed cleanly next to logo fallback index slot
          } else {
            structuralOrder.push('search');
          }

          fetchedLayout.header.order = structuralOrder;
        }

        setLayout(fetchedLayout);
      })
      .catch((error) => setMessage(error instanceof ApiError ? error.message : 'Could not load layout configuration'))
      .finally(() => setLoading(false));
  }, []);

  function updateSection(id: string, content: HomepageSection['content']) {
    setLayout((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === id ? { ...section, content } : section)),
    }));
  }

  function moveSection(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    setLayout((current) => {
      const sections = [...current.sections];
      const sourceIndex = sections.findIndex((section) => section.id === sourceId);
      const targetIndex = sections.findIndex((section) => section.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const [moved] = sections.splice(sourceIndex, 1);
      sections.splice(targetIndex, 0, moved);
      return { ...current, sections: sections.map((section, index) => ({ ...section, sortOrder: index })) };
    });
  }

  function onDrop(event: DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    if (draggedId) moveSection(draggedId, targetId);
    setDraggedId(null);
  }

  function updateHeaderOrder(source: string, target: string) {
    setLayout((current) => {
      const order = [...current.header.order];
      const sourceIndex = order.indexOf(source);
      const targetIndex = order.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      order.splice(sourceIndex, 1);
      order.splice(targetIndex, 0, source);
      return { ...current, header: { ...current.header, order } };
    });
  }

  // Find the uploadImage function inside your src/pages/admin/AdminHomepagePage.tsx and replace it:
  async function uploadImage(section: HomepageSection, file: File, slotIndex?: number) {
    const permittedExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!permittedExtensions.includes(file.type)) {
      setMessage('Invalid file type! Please upload a valid PNG, JPG, JPEG, or WEBP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('File too large! Images must be under 2MB.');
      return;
    }

    try {
      const result = await api.upload<{ url: string }>('/admin/homepage/upload', file);

      // 💥 DYNAMIC ARRAY BUILDER SLOT MANAGEMENT
      if (slotIndex !== undefined) {
        const currentImages = (section.content as any).images || [];
        const updatedImages = [...currentImages];
        updatedImages[slotIndex] = {
          ...updatedImages[slotIndex],
          imageUrl: result.url
        };
        updateSection(section.id, { ...section.content, images: updatedImages });
      } else {
        updateSection(section.id, { ...section.content, imageUrl: result.url });
      }

      setMessage('Image uploaded. Save the layout to publish it.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Image upload failed');
    }
  }

  async function saveLayout(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await api.put<HomepageLayout>('/admin/homepage', layout);
      setLayout(saved);
      setMessage('Homepage layout successfully saved.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Could not save homepage layout');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400 font-bold text-center py-12">Loading homepage editor...</p>;

  return (
    <form onSubmit={saveLayout} className="space-y-6 max-w-7xl mx-auto p-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Homepage Layout Editor</h3>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Manage banners, re-order content blocks, and adjust header sequences.</p>
        </div>
        <button type="submit" disabled={saving} className="rounded-xl bg-bb-green hover:bg-bb-green-dark transition-colors px-6 py-2.5 font-black text-sm text-white shadow-sm disabled:opacity-50">
          {saving ? 'Saving changes...' : 'Save layout'}
        </button>
      </div>

      {message && <p className="rounded-xl bg-bb-green-light border border-bb-green/20 px-4 py-3 text-xs font-bold text-bb-green-darker">{message}</p>}

      {/* HEADER SEQUENCER WIDGET */}
      {/* HEADER SEQUENCER WIDGET */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h4 className="font-black text-sm text-gray-900 tracking-tight">Header Component Layout Sequences</h4>
          <p className="text-[11px] text-gray-400 font-medium">Drag components horizontally to rearrange order in your top bar layout.</p>
        </div>

        {/* 🌟 FIXED: Added items-center, explicit gap spacing, and inline flex properties to stabilize drag tracking */}
        <div className="flex flex-row flex-wrap items-center gap-3 pt-1 border border-dashed border-gray-100 p-3 rounded-xl bg-gray-50/30">
          {layout.header.order.map((item) => (
            <div
              key={item}
              draggable
              onDragStart={() => setDraggedId(`header:${item}`)}
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                // Ensure we are dropping a header item onto another header item
                if (draggedId?.startsWith('header:')) {
                  const sourceItem = draggedId.slice(7);
                  updateHeaderOrder(sourceItem, item);
                }
                setDraggedId(null);
              }}
              /* 🌟 FIXED: Enhanced visual grab indicators, transition-all, and absolute mouse tracking properties */
              className="cursor-grab active:cursor-grabbing select-none rounded-xl border border-bb-green bg-bb-green-light/40 hover:bg-bb-green-light px-4 py-2 text-xs font-black text-bb-green-darker transition-all transform hover:scale-[1.02] shadow-sm flex items-center gap-1.5"
            >
              <span>☷</span>
              <span>{headerLabels[item]}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-50">
          <label className="flex items-center gap-3 text-xs font-bold text-gray-700">
            Header alignment
            <select
              value={layout.header.alignment}
              onChange={(event) => setLayout((current) => ({ ...current, header: { ...current.header, alignment: event.target.value as HomepageLayout['header']['alignment'] } }))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-bb-green text-xs cursor-pointer shadow-sm"
            >
              <option value="left">Left Aligned</option>
              <option value="center">Center Aligned</option>
              <option value="right">Right Aligned</option>
            </select>
          </label>
        </div>
      </section>


      {/* DYNAMIC SECTIONS GRID DISPLAY ELEMENT */}
      <section className="space-y-4">
        {layout.sections.map((section) => (
          <HomepageSectionCard
            key={section.id}
            section={section}
            setDraggedId={setDraggedId}
            onDrop={onDrop}
            onUpdateSection={updateSection}
            onRemoveSection={(id) => setLayout(current => ({ ...current, sections: current.sections.filter(item => item.id !== id) }))}
            onUploadImage={uploadImage}
          />
        ))}
      </section>

      {/* ADD SECTION TRIGGER SWITCH BUTTONS */}
      <div className="flex flex-wrap gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
        {(Object.keys(sectionLabels) as HomepageSectionType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setLayout((current) => ({ ...current, sections: [...current.sections, createSection(type, current.sections.length)] }))}
            className="rounded-xl border border-gray-200 bg-white hover:border-bb-green hover:text-bb-green-darker px-4 py-2 text-xs font-black text-gray-600 transition-all shadow-sm transform active:scale-95"
          >
            + Append {sectionLabels[type]}
          </button>
        ))}
      </div>
    </form>
  );
}
