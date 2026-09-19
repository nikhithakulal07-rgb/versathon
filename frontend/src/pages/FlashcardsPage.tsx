import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, ArrowRight, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { api, Flashcard } from '../lib/api';
import { FlashcardDeck } from '../components/common/FlashcardDeck';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const FlashcardsPage: React.FC = () => {
  const { subtopicId } = useParams<{ subtopicId: string }>();
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get('mission_id');

  const navigate = useNavigate();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedStats, setCompletedStats] = useState<any>(null);

  useEffect(() => {
    if (!subtopicId) return;

    api
      .getSubtopicFlashcards(subtopicId)
      .then((cList) => setCards(cList))
      .catch((e) => console.error('Failed to load flashcards:', e))
      .finally(() => setLoading(false));
  }, [subtopicId]);

  const handleRespond = async (cardId: string, response: 'know' | 'revise') => {
    return await api.respondFlashcard(cardId, response);
  };

  const handleFinish = async (stats: {
    knowCount: number;
    reviseCount: number;
    revisedCards: Flashcard[];
  }) => {
    if (subtopicId) {
      await api.finishFlashcardSession(subtopicId).catch(() => {});
    }
    setCompletedStats(stats);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading flashcard deck...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Curriculum', href: '/school' },
            { label: 'Flashcard Deck' },
          ]}
        />

        <div className="text-center mb-6">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-full border border-amber-500/30 inline-block mb-2">
            Leitner Spaced Repetition
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Concept Flashcards</h1>
          <p className="text-xs text-slate-400 mt-1">
            Swipe Right (→) if you know it • Swipe Left (←) to add to your Revision Required queue
          </p>
        </div>

        <FlashcardDeck
          flashcards={cards}
          onRespond={handleRespond}
          onFinish={handleFinish}
        />

        {completedStats && (
          <div className="flex justify-center gap-3 pt-4">
            {completedStats.reviseCount > 0 && (
              <Link
                to="/revision"
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start Revision Required ({completedStats.reviseCount} Cards)</span>
              </Link>
            )}

            <button
              onClick={() => {
                if (missionId) {
                  navigate(`/game/mission/${missionId}`);
                } else {
                  navigate('/school');
                }
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>{missionId ? 'Return to Expedition' : 'Return to Curriculum'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
