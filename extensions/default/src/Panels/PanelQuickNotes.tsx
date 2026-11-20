import React, { useState } from 'react';
import { Button, ScrollArea, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

interface NoteItem {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY_PREFIX = 'ohif_quick_notes_';

function loadStoredNotes(key: string): NoteItem[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * PanelQuickNotes
 * A simple, beginner-friendly side panel allowing clinicians/users to write,
 * save, and download sticky notes for the open study.
 */
export function PanelQuickNotes() {
  const { servicesManager } = useSystem();
  const { displaySetService } = servicesManager?.services || {};

  const activeDisplaySets = displaySetService?.getActiveDisplaySets?.() || [];
  const studyKey = activeDisplaySets[0]?.StudyInstanceUID || 'general';

  // Key-driven state initialization: re-computes on studyKey change
  const [currentStudyKey, setCurrentStudyKey] = useState<string>(studyKey);
  const [notes, setNotes] = useState<NoteItem[]>(() => loadStoredNotes(studyKey));
  const [currentText, setCurrentText] = useState<string>('');

  // When studyKey changes, update state during render transition (standard React pattern)
  if (currentStudyKey !== studyKey) {
    setCurrentStudyKey(studyKey);
    setNotes(loadStoredNotes(studyKey));
  }

  // Helper to persist notes to localStorage
  const persistNotes = (updatedNotes: NoteItem[]) => {
    setNotes(updatedNotes);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${studyKey}`, JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed to save quick notes to localStorage', e);
    }
  };

  const handleAddNote = () => {
    const trimmed = currentText.trim();
    if (!trimmed) {
      return;
    }

    const newNote: NoteItem = {
      id: Date.now().toString(),
      text: trimmed,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newNote, ...notes];
    persistNotes(updated);
    setCurrentText('');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(note => note.id !== id);
    persistNotes(updated);
  };

  const handleExportNotes = () => {
    if (notes.length === 0) {
      return;
    }

    const textContent = notes
      .map((note, index) => `Note #${index + 1} (${note.createdAt}):\n${note.text}\n`)
      .join('\n-------------------------\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quick_notes_${studyKey}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-muted/40 p-3 text-foreground select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icons.Pencil className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Quick Notes</span>
        </div>
        {notes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportNotes}
            className="h-6 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Icons.Download className="h-3.5 w-3.5" />
            Export
          </Button>
        )}
      </div>

      {/* Input area */}
      <div className="pt-3 flex flex-col gap-2">
        <textarea
          value={currentText}
          onChange={e => setCurrentText(e.target.value)}
          placeholder="Type a clinical note or reminder..."
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          variant="default"
          size="sm"
          onClick={handleAddNote}
          disabled={!currentText.trim()}
          className="self-end text-xs h-7 px-3"
        >
          Add Note
        </Button>
      </div>

      {/* Notes list */}
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Notes ({notes.length})
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center p-4 text-xs text-muted-foreground">
            No notes added yet for this study.
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-1">
            <div className="flex flex-col gap-2">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="rounded-md border border-border bg-card p-2.5 text-xs shadow-sm flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{note.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete note"
                    >
                      <Icons.Trash className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-card-foreground select-text font-normal leading-relaxed">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export default PanelQuickNotes;
