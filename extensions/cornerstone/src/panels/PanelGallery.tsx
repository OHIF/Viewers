import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollArea,
  Icons,
  useImageViewer,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
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
const API_STUDY_IMAGE_DELETE = (base: string, studyId: number, imageId: number) =>
  `${base.replace(/\/$/, '')}/api/study/${studyId}/image/${imageId}`;

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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type ActionBtnProps = {
  onClick: (e?: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md';
};

const ActionBtn = ({ onClick, title, children, disabled = false, variant = 'default', size = 'md' }: ActionBtnProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        tabIndex={-1}
        className={`flex items-center justify-center rounded transition-colors disabled:opacity-40 ${
          size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
        } ${
          variant === 'danger'
            ? 'text-[#a3a3a3] hover:bg-red-900/40 hover:text-red-400'
            : 'text-[#a3a3a3] hover:bg-[#3a3a3a] hover:text-white'
        }`}
        aria-label={title}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top">{title}</TooltipContent>
  </Tooltip>
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
  const [studyId, setStudyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudyImage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!baseUrl || !externalId) return;
    setLoading(true);
    setError(null);
    const studyRes = await fetch(API_STUDY_EXTERNAL(baseUrl, externalId));
    if (!studyRes.ok) {
      setError("Impossible de charger l'étude.");
      setLoading(false);
      return;
    }
    const study = await studyRes.json();
    setStudyId(study.id);
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

  useEffect(() => { fetchImages(); }, [fetchImages]);

  useEffect(() => {
    const handleRefresh = () => fetchImages();
    window.addEventListener('pacsia:gallery-refresh', handleRefresh);
    return () => window.removeEventListener('pacsia:gallery-refresh', handleRefresh);
  }, [fetchImages]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setIsFullscreen(false);
    setShowDeleteConfirm(false);
  }, []);

  const goToPrev = useCallback(() => {
    setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback((total: number) => {
    setLightboxIndex(prev => (prev !== null && prev < total - 1 ? prev + 1 : prev));
  }, []);

  const handleLightboxKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showDeleteConfirm) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goToNext(images.length); }
  }, [showDeleteConfirm, goToPrev, goToNext, images.length]);

  // Ouvre le confirm depuis la lightbox ou les miniatures
  const openDeleteConfirm = useCallback((img: StudyImage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteTarget(img);
    setShowDeleteConfirm(true);
  }, []);

  const handleDownload = useCallback((img: StudyImage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    window.open(img.url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget || studyId === null || !baseUrl) return;
    setIsDeleting(true);
    const res = await fetch(API_STUDY_IMAGE_DELETE(baseUrl, studyId, deleteTarget.id), { method: 'DELETE' });
    setIsDeleting(false);
    if (!res.ok) { setShowDeleteConfirm(false); return; }

    const deletedId = deleteTarget.id;
    const newImages = images.filter(i => i.id !== deletedId);
    setImages(newImages);
    setDeleteTarget(null);
    setShowDeleteConfirm(false);

    if (lightboxIndex !== null) {
      if (newImages.length === 0) {
        setLightboxIndex(null);
        setIsFullscreen(false);
      } else if (lightboxIndex >= newImages.length) {
        setLightboxIndex(newImages.length - 1);
      }
    }
  }, [deleteTarget, studyId, baseUrl, images, lightboxIndex]);

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  const dialogClassName = isFullscreen
    ? 'flex flex-col gap-0 border-0 bg-[#1e1e1e] p-0 text-white [&>button]:hidden rounded-none'
    : 'flex flex-col gap-0 border-[#333] bg-[#1e1e1e] p-0 text-white [&>button]:hidden';
  const dialogStyle: React.CSSProperties = isFullscreen
    ? { position: 'fixed', top: 0, left: 0, maxWidth: '100vw', width: '100vw', height: '100vh', transform: 'none', margin: 0, borderRadius: 0 }
    : { maxWidth: '900px', width: '90vw' };

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
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded bg-[#2a2a2a] cursor-pointer"
                onClick={() => setLightboxIndex(index)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setLightboxIndex(index)}
                aria-label={img.name}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-cover transition-opacity duration-150 group-hover:opacity-70"
                  loading="lazy"
                />
                {/* Overlay actions au hover */}
                <div
                  className="absolute inset-x-0 bottom-0 flex justify-center pb-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-0 rounded-lg bg-[#0e0e0e]/90 px-1 py-0.5">
                    <ActionBtn size="sm" onClick={e => handleDownload(img, e)} title="Télécharger">
                      <Icons.ByName name="DownloadImage" className="h-3.5 w-3.5" />
                    </ActionBtn>
                    <div className="mx-0.5 h-3 w-px bg-[#444]" />
                    <ActionBtn size="sm" onClick={e => { e?.stopPropagation(); }} title="Modifier">
                      <Icons.ByName name="EditImage" className="h-3.5 w-3.5" />
                    </ActionBtn>
                    <div className="mx-0.5 h-3 w-px bg-[#444]" />
                    <ActionBtn size="sm" variant="danger" onClick={e => openDeleteConfirm(img, e)} title="Supprimer">
                      <Icons.ByName name="DeleteImage" className="h-3.5 w-3.5" />
                    </ActionBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Lightbox */}
      <Dialog
        open={lightboxIndex !== null && !showDeleteConfirm}
        onOpenChange={open => !open && closeLightbox()}
      >
        <DialogContent
          className={dialogClassName}
          style={dialogStyle}
          onKeyDown={handleLightboxKeyDown}
        >
          {/* Ancre de focus invisible : reçoit l'auto-focus sans déclencher de tooltip */}
          <span tabIndex={0} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, outline: 'none' }} />
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#333] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm text-[#a3a3a3]">{currentImage?.name ?? ''}</span>
              <span className="shrink-0 text-xs text-[#555]">
                {lightboxIndex !== null ? `${lightboxIndex + 1} / ${images.length}` : ''}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {/* Action group */}
              <div className="flex items-center rounded bg-[#252525] px-0.5 py-0.5">
                <ActionBtn onClick={() => currentImage && handleDownload(currentImage)} title="Télécharger">
                  <Icons.ByName name="DownloadImage" className="h-4 w-4" />
                </ActionBtn>
                <ActionBtn onClick={() => {}} title="Modifier">
                  <Icons.ByName name="EditImage" className="h-4 w-4" />
                </ActionBtn>
                <ActionBtn
                  onClick={() => currentImage && openDeleteConfirm(currentImage)}
                  title="Supprimer"
                  variant="danger"
                >
                  <Icons.ByName name="DeleteImage" className="h-4 w-4" />
                </ActionBtn>
              </div>

              <div className="mx-1.5 h-4 w-px bg-[#333]" />

              <ActionBtn
                onClick={() => setIsFullscreen(f => !f)}
                title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              >
                <Icons.ByName name={isFullscreen ? 'FullscreenExit' : 'Fullscreen'} className="h-4 w-4" />
              </ActionBtn>

              <button
                type="button"
                tabIndex={-1}
                onClick={closeLightbox}
                className="ml-0.5 flex h-8 w-8 items-center justify-center rounded text-[#808080] transition-colors hover:bg-[#2a2a2a] hover:text-white"
                aria-label="Fermer"
              >
                <XIcon />
              </button>
            </div>
          </div>

          {/* Image zone */}
          <div className={`relative flex items-center justify-center bg-black overflow-hidden ${isFullscreen ? 'flex-1' : 'min-h-[500px]'}`}>
            {currentImage && (
              <img
                src={currentImage.url}
                alt={currentImage.name}
                className={isFullscreen ? 'max-h-full max-w-full object-contain' : 'max-h-[75vh] w-auto object-contain'}
                style={{ minWidth: '200px' }}
              />
            )}
            {lightboxIndex !== null && lightboxIndex > 0 && (
              <button
                type="button"
                tabIndex={-1}
                onClick={goToPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[#2a2a2a]/80 p-2 text-white transition-colors hover:bg-[#3a3a3a]"
                aria-label="Image précédente"
              >
                <ChevronLeftIcon />
              </button>
            )}
            {lightboxIndex !== null && lightboxIndex < images.length - 1 && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => goToNext(images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#2a2a2a]/80 p-2 text-white transition-colors hover:bg-[#3a3a3a]"
                aria-label="Image suivante"
              >
                <ChevronRightIcon />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <Dialog open={showDeleteConfirm} onOpenChange={open => !open && setShowDeleteConfirm(false)}>
        <DialogContent className="border-[#333] bg-[#1e1e1e] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Supprimer l&apos;image</DialogTitle>
            <DialogDescription className="text-[#a3a3a3]">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="font-medium text-white">{deleteTarget?.name}</span> ?
              Elle sera supprimée définitivement de la photothèque.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/40 disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
