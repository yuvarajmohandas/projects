import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HomepageLayout } from '../types';

interface PromoBannerProps {
  homepage: HomepageLayout | null;
}

export function PromoBanner({ homepage }: PromoBannerProps) {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSection = homepage?.sections.find(s => s.type === 'hero' && s.isActive);
  const carouselImages = (heroSection?.content as any)?.images || [];

// Open up src/components/PromoBanner.tsx and update the automated slider rotation effect:
useEffect(() => {
  if (carouselImages.length <= 1) return;
  
  // 💥 FIXED: Dynamically pulls the speed delay threshold selection, defaults to 4000ms if not specified
  const intervalDelay = Number((heroSection?.content as any)?.rotationInterval ?? 4000);
  
  // If the admin turned off auto-rotation by selecting 0, skip building the timer loop
  if (intervalDelay === 0) return;

  const interval = setInterval(() => {
    setActiveSlide((curr) => (curr + 1) % carouselImages.length);
  }, intervalDelay); // Passes our clickable delay parameter here smoothly!

  return () => clearInterval(interval);
}, [carouselImages.length, heroSection]);


  if (!heroSection) return null;

  return (
    <div className="relative w-full overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm group min-h-[12rem] sm:min-h-[16rem]">
      {carouselImages.length > 0 ? (
        <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 overflow-hidden">
          {carouselImages.map((slide: any, index: number) => (
            <div
              key={index}
              onClick={() => slide.link && navigate(slide.link)}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 cursor-pointer ${
                index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* 🌟 FIXED: Dynamically sets object-contain and an elegant background if 'CONTAIN' option is clicked */}
              <img 
                src={slide.imageUrl} 
                alt="" 
                className={`w-full h-full object-center transition-all ${
                  slide.fit === 'CONTAIN' ? 'object-contain bg-gray-100 p-2' : 'object-cover'
                }`} 
              />
            </div>
          ))}

          {/* Bottom Navigator Pill dots overlay */}
          {carouselImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20">
              {carouselImages.map((_: any, idx: number) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeSlide ? 'bg-bb-green w-5' : 'bg-gray-300 w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        heroSection.content.imageUrl && (
          <img src={heroSection.content.imageUrl} alt="" className="h-48 sm:h-64 md:h-72 w-full object-cover" />
        )
      )}
    </div>
  );
}
