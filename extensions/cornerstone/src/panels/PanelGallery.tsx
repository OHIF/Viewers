import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollArea,
  Icons,
  useImageViewer,
  Dialog,
  DialogContent,
} from '@ohif/ui-next';

type StudyImage = {
  id: number;
  name: string;
  url: string;
};

const API_STUDY_EXTERNAL = (base: string, externalId: string) =>
  `${base.replace(/\/$/, '')}/api/study/external/${encodeURIComponent(externalId)}`;

const API_STUDY_IMAGES = (base: string, studyId: number) =>
  `${base.replace(/\/$/, '')}/api/study/${studyId}/image`;

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function PanelGallery(): React.ReactNode {
  const appConfig = typeof window !== 'undefined' ? (window as any).config : {};
  const proxyPath = appConfig?.ekkoPacsApi?.proxyPath ?? '';
  const baseUrlConfig = appConfig?.ekkoPacsApi?.baseUrl ?? '';
  const baseUrl =
    baseUrlConfig ||
    (proxyPath && typeof window !== 'undefined' ? window.location.origin + proxyPath : '');

  const viewerContext = useImageViewer();
  const studyInstanceUIDs = viewerContext?.StudyInstanceUIDs ?? [];
  const externalId = studyInstanceUIDs[0] ?? null;

  const [images, setImages] = useState<StudyImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchImages = useCallback(async () => {
    if (!baseUrl || !externalId) return;
    setLoading(true);
    setError(null);
    const studyRes = await fetch(API_STUDY_EXTERNAL(baseUrl, externalId));
    if (!studyRes.ok) {
      setError('Impossible de charger l\'étude.');
      setLoading(false);
      return;
    }
    const study = await studyRes.json();
    const imagesRes = await fetch(API_STUDY_IMAGES(baseUrl, study.id));
    if (!imagesRes.ok) {
      setError('Impossible de charger les images.');
      setLoading(false);
      return;
    }
    const data: StudyImage[] = await imagesRes.json();
    setImages(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [baseUrl, externalId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goToPrev = useCallback(() => {
    setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setLightboxIndex(prev => (prev !== null && prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, goToPrev, goToNext]);

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="shrink-0 border-b border-[#333] px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Photothèque</h2>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center gap-2 p-6">
            <Icons.ByName name="LoadingSpinner" className="h-4 w-4 text-[#808080]" />
            <span className="text-sm text-[#808080]">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex min-h-[200px] items-center justify-center p-6">
            <p className="text-center text-sm text-destructive">{error}</p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center p-6">
            <p className="text-center text-sm text-[#666]">Aucune image dans la photothèque</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[10px] p-[5px] pt-[4px]">
            {images.map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => openLightbox(index)}
                className="group relative aspect-square overflow-hidden rounded bg-[#2a2a2a] cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
                title={img.name}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-cover transition-opacity duration-150 group-hover:opacity-80"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={open => !open && closeLightbox()}>
        <DialogContent className="flex flex-col gap-0 border-[#333] bg-[#1e1e1e] p-0 text-white [&>button]:hidden"
          style={{ maxWidth: '900px', width: '90vw' }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#333] px-4 py-3">
            <span className="truncate text-sm text-[#a3a3a3]">
              {currentImage?.name ?? ''}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#666]">
                {lightboxIndex !== null ? `${lightboxIndex + 1} / ${images.length}` : ''}
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                className="rounded p-1 text-[#808080] hover:bg-[#2a2a2a] hover:text-white"
                aria-label="Fermer"
              >
                <XIcon />
              </button>
            </div>
          </div>

          {/* Image zone */}
          <div className="relative flex min-h-[500px] items-center justify-center bg-black">
            {currentImage && (
              <img
                src={currentImage.url}
                alt={currentImage.name}
                className="max-h-[75vh] w-auto object-contain"
                style={{ minWidth: '200px' }}
              />
            )}

            {/* Flèche gauche */}
            {lightboxIndex !== null && lightboxIndex > 0 && (
              <button
                type="button"
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[#2a2a2a]/80 p-2 text-white hover:bg-[#3a3a3a] transition-colors"
                aria-label="Image précédente"
              >
                <ChevronLeftIcon />
              </button>
            )}

            {/* Flèche droite */}
            {lightboxIndex !== null && lightboxIndex < images.length - 1 && (
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#2a2a2a]/80 p-2 text-white hover:bg-[#3a3a3a] transition-colors"
                aria-label="Image suivante"
              >
                <ChevronRightIcon />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
