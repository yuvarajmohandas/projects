import { useEffect, useState, type DragEvent, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { HomepageLayout, HomepageSection, HomepageSectionType } from '../../types';

const defaultLayout: HomepageLayout = {
  header: { order: ['logo', 'name', 'navigation', 'cart'], alignment: 'left' },
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
  logo: 'Logo',
  name: 'Website name',
  navigation: 'Navigation',
  cart: 'Basket',
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
      .then(setLayout)
      .catch((error) => setMessage(error instanceof ApiError ? error.message : 'Could not load homepage layout'))
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

  async function uploadImage(section: HomepageSection, file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }
    try {
      const result = await api.upload<{ url: string }>('/admin/homepage/upload', file);
      updateSection(section.id, { ...section.content, imageUrl: result.url });
      setMessage('Image uploaded. Save the layout to publish it.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Image upload failed');
    }
  }

  function onFileDrop(event: DragEvent<HTMLDivElement>, section: HomepageSection) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void uploadImage(section, file);
  }

  async function saveLayout(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await api.put<HomepageLayout>('/admin/homepage', layout);
      setLayout(saved);
      setMessage('Homepage layout saved.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Could not save homepage layout');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading homepage editor...</p>;

  return (
    <form onSubmit={saveLayout} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Homepage editor</h3>
          <p className="text-sm text-gray-500">Drag sections and header items to rearrange them.</p>
        </div>
        <button type="submit" disabled={saving} className="rounded-lg bg-bb-green px-5 py-2 font-bold text-white disabled:opacity-50">
          {saving ? 'Saving...' : 'Save layout'}
        </button>
      </div>

      {message && <p className="rounded-lg bg-bb-green-light px-4 py-3 text-sm text-bb-green-darker">{message}</p>}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h4 className="font-bold text-gray-900">Header layout</h4>
        <p className="mb-4 text-sm text-gray-500">This controls the order of the items in your website header.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {layout.header.order.map((item) => (
            <div
              key={item}
              draggable
              onDragStart={() => setDraggedId(`header:${item}`)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedId?.startsWith('header:')) updateHeaderOrder(draggedId.slice(7), item);
                setDraggedId(null);
              }}
              className="cursor-grab rounded-lg border border-bb-green bg-bb-green-light px-4 py-2 text-sm font-semibold text-bb-green-darker"
            >
              ☷ {headerLabels[item]}
            </div>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          Header alignment
          <select
            value={layout.header.alignment}
            onChange={(event) => setLayout((current) => ({ ...current, header: { ...current.header, alignment: event.target.value as HomepageLayout['header']['alignment'] } }))}
            className="rounded-lg border border-gray-200 px-3 py-2 font-normal"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </section>

      <section className="space-y-3">
        {layout.sections.map((section) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDraggedId(section.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, section.id)}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="font-bold text-gray-900">☷ {sectionLabels[section.type]}</h4>
              <button
                type="button"
                onClick={() => setLayout((current) => ({ ...current, sections: current.sections.filter((item) => item.id !== section.id) }))}
                className="text-sm font-semibold text-red-600"
              >
                Remove
              </button>
            </div>
            {section.type !== 'spacer' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={section.content.title ?? ''}
                  onChange={(event) => updateSection(section.id, { ...section.content, title: event.target.value })}
                  placeholder="Section title"
                  className="rounded-lg border border-gray-200 px-3 py-2"
                />
                <input
                  value={section.content.buttonText ?? ''}
                  onChange={(event) => updateSection(section.id, { ...section.content, buttonText: event.target.value })}
                  placeholder="Button text (optional)"
                  className="rounded-lg border border-gray-200 px-3 py-2"
                />
                <textarea
                  value={section.content.description ?? ''}
                  onChange={(event) => updateSection(section.id, { ...section.content, description: event.target.value })}
                  placeholder="Description"
                  className="rounded-lg border border-gray-200 px-3 py-2 sm:col-span-2"
                  rows={2}
                />
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onFileDrop(event, section)}
                  className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-sm text-gray-500 sm:col-span-2"
                >
                  {section.content.imageUrl ? (
                    <img src={section.content.imageUrl} alt="" className="mb-2 h-32 w-full rounded-lg object-cover" />
                  ) : (
                    <p>Drop an image here or choose a file</p>
                  )}
                  <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadImage(section, event.target.files[0])} />
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(sectionLabels) as HomepageSectionType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setLayout((current) => ({ ...current, sections: [...current.sections, createSection(type, current.sections.length)] }))}
            className="rounded-lg border border-bb-green bg-white px-3 py-2 text-sm font-semibold text-bb-green-darker"
          >
            + {sectionLabels[type]}
          </button>
        ))}
      </div>
    </form>
  );
}
