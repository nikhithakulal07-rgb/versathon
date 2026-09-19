import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';
import {
  api,
  Board,
  SchoolClass,
  Stream,
  Subject,
  Chapter,
  Topic,
} from '../lib/api';
import { MasteryRing } from '../components/common/MasteryRing';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export const CurriculumBrowserPage: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Current selections
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    Promise.all([api.getClasses(), api.getBoards(), api.getStreams()]).then(
      ([cList, bList, sList]) => {
        setClasses(cList);
        setBoards(bList);
        setStreams(sList);

        const c10 = cList.find((c) => c.grade === 10) || cList[0];
        const cbse = bList.find((b) => b.code === 'CBSE') || bList[0];

        if (c10) setSelectedClassId(c10.id);
        if (cbse) setSelectedBoardId(cbse.id);
        if (sList[0]) setSelectedStreamId(sList[0].id);
      }
    );
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedBoard = boards.find((b) => b.id === selectedBoardId);
  const isHighSchool = selectedClass && (selectedClass.grade === 11 || selectedClass.grade === 12);

  // Fetch subjects when Class, Board, or Stream change
  useEffect(() => {
    if (!selectedClassId || !selectedBoardId) return;
    setLoadingSubjects(true);

    api
      .getSubjects({
        class_id: selectedClassId,
        board_id: selectedBoardId,
        stream_id: isHighSchool ? selectedStreamId : undefined,
      })
      .then((subjList) => {
        setSubjects(subjList);
        if (subjList.length > 0) {
          setSelectedSubjectId(subjList[0].id);
        } else {
          setSelectedSubjectId('');
          setChapters([]);
        }
      })
      .finally(() => setLoadingSubjects(false));
  }, [selectedClassId, selectedBoardId, selectedStreamId, isHighSchool]);

  // Fetch chapters when Subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      return;
    }

    api.getChapters(selectedSubjectId).then((chList) => {
      setChapters(chList);
    });
  }, [selectedSubjectId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'School Mode', href: '/school' },
            {
              label: `${selectedClass ? `Class ${selectedClass.grade}` : ''} • ${
                selectedBoard?.code || 'CBSE'
              }`,
            },
          ]}
        />

        {/* Top Curriculum Filter Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                School Curriculum Browser
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Class → Board → Stream → Subject → Chapter → Topic
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-full text-xs font-medium">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Sample curriculum for CBSE, ICSE, State Boards</span>
            </div>
          </div>

          {/* Classes Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Class:
            </span>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold font-mono text-xs transition-colors shrink-0 ${
                  selectedClassId === cls.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Class {cls.grade}
              </button>
            ))}
          </div>

          {/* Board & Stream Selector */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Board:
              </span>
              <div className="flex gap-1.5">
                {boards.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBoardId(b.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      selectedBoardId === b.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {b.code}
                  </button>
                ))}
              </div>
            </div>

            {isHighSchool && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Stream:
                </span>
                <div className="flex gap-1.5">
                  {streams.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStreamId(s.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                        selectedStreamId === s.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Custom Topic & Diagnostic Generator Bar */}
        <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Generate Any Custom Topic with AI</h3>
                <p className="text-xs text-purple-200/80">
                  Type any topic to generate structured subtopics, multi-level explanations, flashcards & launch an instant diagnostic test!
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-300 px-2.5 py-1 bg-purple-900/50 rounded-lg border border-purple-500/30 shrink-0">
              Universal Diagnostic Guarantee
            </span>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem('customTopic') as HTMLInputElement;
              const val = input?.value?.trim();
              if (!val) return;
              try {
                input.disabled = true;
                const newTopic = await api.createOpenTopic({
                  topic_text: val,
                  learner_type: 'general',
                  level_hint: 'beginner',
                });
                window.location.href = `/diagnostic/${newTopic.id}`;
              } catch (err: any) {
                alert(`Error creating AI topic: ${err.message}`);
                input.disabled = false;
              }
            }}
            className="flex flex-col sm:flex-row gap-2 pt-1"
          >
            <input
              name="customTopic"
              type="text"
              placeholder="Enter any topic (e.g. Quantum Computing, Organic Reactions, Calculus Integrals, World History)..."
              className="flex-1 px-4 py-2.5 bg-slate-900/90 border border-purple-500/30 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate & Start Diagnostic</span>
            </button>
          </form>
        </div>

        {/* Main Content Layout: Subject Tabs on Left, Chapters & Topics on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Subject Tabs (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Subjects ({subjects.length})
            </h2>

            {loadingSubjects ? (
              <div className="p-4 bg-slate-900/60 rounded-2xl text-xs text-slate-400 text-center">
                Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="p-4 bg-slate-900/60 rounded-2xl text-xs text-slate-400 text-center">
                No subjects found for this selection.
              </div>
            ) : (
              <div className="space-y-2">
                {subjects.map((subj) => {
                  const isSelected = selectedSubjectId === subj.id;
                  return (
                    <button
                      key={subj.id}
                      onClick={() => setSelectedSubjectId(subj.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-blue-950/50 border-blue-500/80 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{subj.icon || '📚'}</span>
                        <div>
                          <span className="font-bold text-sm block">{subj.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {subj.code}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chapters & Topics Tree (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Chapters & Topics
            </h2>

            {chapters.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No chapters seeded yet for this subject.
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                          Chapter {chapter.order}
                        </span>
                        <h3 className="text-base font-bold text-white">{chapter.title}</h3>
                      </div>
                      <span className="text-xs text-slate-400">
                        {chapter.topics?.length || 0} Topics
                      </span>
                    </div>

                    {/* Topics in this chapter */}
                    <div className="space-y-3">
                      {chapter.topics && chapter.topics.length > 0 ? (
                        chapter.topics.map((topic) => (
                          <Link
                            key={topic.id}
                            to={`/topic/${topic.id}`}
                            className="p-4 bg-slate-950/70 hover:bg-slate-950 border border-slate-800/90 hover:border-indigo-500/60 rounded-2xl flex items-center justify-between transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <MasteryRing mastery={topic.overall_mastery || 0} size={48} />
                              <div>
                                <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                                  {topic.title}
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {topic.subtopics?.length || 0} subtopics • Diagnostic, Visuals & Adaptive MCQs
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {topic.source === 'seed' && (
                                <span className="hidden sm:inline-block text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full font-bold">
                                  Full Slice
                                </span>
                              )}
                              <span className="p-2 rounded-xl bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-indigo-600 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 text-center py-3">
                          No topics found in this chapter.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
