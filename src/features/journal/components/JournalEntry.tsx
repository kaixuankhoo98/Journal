import { useState, useEffect } from 'react';
import { BookOpen, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { useJournalEntry, useUpsertEntry } from '../../../hooks';
import { cn } from '../../../lib/utils';
import { MOODS, type Mood } from '../../../types';

interface JournalEntryProps {
  date: string;
}

export function JournalEntry({ date }: JournalEntryProps) {
  const { data: entry, isLoading } = useJournalEntry(date);
  const upsertEntry = useUpsertEntry();

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state with fetched data
  useEffect(() => {
    setContent(entry?.content || '');
    setMood(entry?.mood as Mood | undefined);
    setHasChanges(false);
  }, [entry]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      if (content.trim() || mood) {
        upsertEntry.mutate({
          entry_date: date,
          content: content.trim(),
          mood,
        });
        setHasChanges(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, mood, hasChanges, date, upsertEntry]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleMoodSelect = (selectedMood: Mood) => {
    setMood(mood === selectedMood ? undefined : selectedMood);
    setHasChanges(true);
  };

  return (
    <Card className="p-4 flex-1">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-coral-500" />
            Journal
          </span>
          {hasChanges && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Save className="w-3 h-3 animate-pulse" />
              Saving...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-3">
        {/* Mood selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mood:</span>
          <div className="flex gap-1">
            {MOODS.map(({ value, emoji, label }) => (
              <button
                key={value}
                onClick={() => handleMoodSelect(value)}
                title={label}
                className={cn(
                  'w-7 h-7 rounded-full text-lg transition-all',
                  'hover:bg-gray-100 hover:scale-110',
                  mood === value && 'bg-lavender-100 ring-2 ring-lavender-300 scale-110'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Journal text area */}
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="How was your day? Write a quick note..."
            className={cn(
              'w-full min-h-[120px] p-3 rounded-lg resize-none',
              'bg-white/50 border border-gray-100',
              'placeholder:text-gray-300 text-sm leading-relaxed',
              'focus:outline-none focus:ring-2 focus:ring-lavender-200 focus:border-transparent'
            )}
          />
        )}

        <p className="text-xs text-gray-400 text-right">
          {content.length > 0 ? `${content.split(/\s+/).filter(Boolean).length} words` : 'Start typing...'}
        </p>
      </CardContent>
    </Card>
  );
}
