import { type DragEvent, type ChangeEvent, useRef } from 'react';
import type { HomepageSection, HomepageSectionType } from '../../../types';

const sectionLabels: Record<HomepageSectionType, string> = {
  hero: 'Hero Carousel (3 Banners)',
  'image-text': 'Image and text',
  categories: 'Categories',
  products: 'Featured products',
  spacer: 'Spacer',
};

interface HomepageSectionCardProps {
  section: HomepageSection;
  setDraggedId: (id: string | null) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, targetId: string) => void;
  onUpdateSection: (id: string, content: HomepageSection['content']) => void;
  onRemoveSection: (id: string) => void;
  onUploadImage: (section: HomepageSection, file: File, slotIndex?: number) => void;
}

export function HomepageSectionCard({
  section,
  setDraggedId,
  onDrop,
  onUpdateSection,
  onRemoveSection,
  onUploadImage,
}: HomepageSectionCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Safely extract properties with fallback defaults to ensure rendering
  const slideImages = section.content.images || [];
  const rotationValue = section.content.rotationInterval || '4000';

  return (
    <div
      draggable
      onDragStart={() => setDraggedId(section.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, section.id)}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="font-black text-sm tracking-tight text-gray-900 cursor-grab flex items-center gap-2 select-none">
          <span>☷</span> {sectionLabels[section.type] || section.type}
        </h4>
        <button
          type="button"
          onClick={() => onRemoveSection(section.id)}
          className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline"
        >
          Remove Row
        </button>
      </div>

      {section.type === 'spacer' ? null : (section.type === 'hero' || section.id.includes('hero')) ? (
        /* 💥 CAROUSEL EDITOR INTERFACE VIEW MODE */
        <div className="space-y-4">

          {/* ⏱️ INTERACTIVE SPEED TIMING OPTIONS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div>
              <span className="text-xs font-black text-gray-800 block">⏱️ Carousel Rotation Timer</span>
              <span className="text-[10px] text-gray-400 font-medium">Configure how fast or slow banners change automatically.</span>
            </div>
            <div>
              <select
                value={String(rotationValue)}
                onChange={(e) => {
                  onUpdateSection(section.id, {
                    ...section.content,
                    rotationInterval: e.target.value
                  });
                }}
                className="border border-gray-200 rounded-lg p-2 text-xs bg-white text-gray-700 font-black focus:outline-none cursor-pointer"
              >
                <option value="2000">⚡ High Speed (2 Seconds)</option>
                <option value="4000">⏱️ Balanced Standard (4 Seconds)</option>
                <option value="6000">🐢 Relaxed Slow (6 Seconds)</option>
                <option value="0">❌ Disable Auto-Rotation (Static)</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Upload Carousel Banners (Max 3 slides)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => {
              const currentImageUrl = slideImages[index]?.imageUrl || '';
              const currentFit = slideImages[index]?.fit || 'COVER';

              return (
                <div key={index} className="border border-gray-100 rounded-xl p-3 bg-gray-50/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-700">Slide Slot #{index + 1}</span>
                    {currentImageUrl && (
                      <span className="text-[10px] font-bold text-bb-green-darker bg-bb-green-light px-1.5 py-0.2 rounded">Active</span>
                    )}
                  </div>

                  <label className="border-2 border-dashed border-gray-200 hover:border-bb-green bg-white rounded-xl h-28 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer transition-all">
                    {currentImageUrl ? (
                      <div className="absolute inset-0">
                        <img
                          src={currentImageUrl}
                          alt=""
                          className={`w-full h-full ${currentFit === 'CONTAIN' ? 'object-contain bg-gray-100' : 'object-cover'}`}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-white text-[10px] font-bold">Click to Replace</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 space-y-1">
                        <span className="text-xl">🖼️</span>
                        <p className="text-[10px] font-bold text-gray-500">Pick Banner File</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".png, .jpg, .jpeg, .webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadImage(section, file, index);
                      }}
                    />
                  </label>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-0.5">Banner Image Fit</label>
                    <select
                      value={currentFit}
                      onChange={(e) => {
                        const updatedImages = [...slideImages];
                        updatedImages[index] = { ...updatedImages[index], fit: e.target.value as 'CONTAIN' | 'COVER' };
                        onUpdateSection(section.id, { ...section.content, images: updatedImages });
                      }}
                      className="w-full border border-gray-200 rounded-lg p-1 text-xs bg-white text-gray-700 font-bold focus:outline-none"
                    >
                      <option value="COVER">🖼️ Fill & Crop</option>
                      <option value="CONTAIN">🎯 Fit Intact</option>
                    </select>
                  </div>

                  <input
                    value={slideImages[index]?.link || ''}
                    onChange={(e) => {
                      const updatedImages = [...slideImages];
                      updatedImages[index] = { ...updatedImages[index], link: e.target.value };
                      onUpdateSection(section.id, { ...section.content, images: updatedImages });
                    }}
                    placeholder="Redirect Link (e.g. /offers)"
                    className="w-full border border-gray-200 rounded-lg p-1.5 text-xs bg-white focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Normal Layout for other generic categories rows fields */
        /* Normal Layout for Image and text rows fields */
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">

            {/* 🌟 NEW: LIVE DYNAMIC LAYOUT STRUCTURE ORIENTATION SELECTOR */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Section Title</label>
                <input
                  value={section.content.title ?? ''}
                  onChange={(e) => onUpdateSection(section.id, { ...section.content, title: e.target.value })}
                  placeholder="e.g. India Gate Special"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Layout Orientation</label>
                <select
                  value={(section.content as any).textAlignment || 'LEFT'}
                  onChange={(e) => onUpdateSection(section.id, { ...section.content, textAlignment: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2 text-sm bg-white font-bold text-gray-700 focus:outline-none"
                >
                  <option value="LEFT">📝 Text Left, Image Right</option>
                  <option value="RIGHT">🖼️ Image Left, Text Right</option>
                  <option value="CENTER">🎯 Centered Text Stack</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Button Callout Text (Optional)</label>
              <input
                value={section.content.buttonText ?? ''}
                onChange={(e) => onUpdateSection(section.id, { ...section.content, buttonText: e.target.value })}
                placeholder="e.g. Shop Now"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Description Subtext</label>
              <textarea
                value={section.content.description ?? ''}
                onChange={(e) => onUpdateSection(section.id, { ...section.content, description: e.target.value })}
                placeholder="Description"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50 h-16 resize-none"
                rows={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Banner Image Asset</label>
            <div className="border-2 border-dashed border-gray-200 hover:border-bb-green bg-gray-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all min-h-[11rem] relative overflow-hidden group cursor-pointer">
              {section.content.imageUrl ? (
                <img src={section.content.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <p className="text-xs font-bold text-gray-500">Click to choose image file</p>
              )}
              <input
                type="file"
                accept=".png, .jpg, .jpeg, .webp"
                className="hidden"
                onChange={(e) => e.target.files?.length && onUploadImage(section, e.target.files[0])}
              />
            </div>
          </div>
        </div>


      )}
    </div>
  );
}
