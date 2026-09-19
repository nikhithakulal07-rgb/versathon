import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  BookOpen,
  Bot,
  User,
  Compass,
  Zap,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Brain,
  MessageSquare,
  Flame,
} from 'lucide-react';
import {
  api,
  Topic,
  TutorResponse,
} from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { MasteryBar } from '../components/common/MasteryBar';
import { StatusPill } from '../components/common/StatusPill';
import { VisualRenderer } from '../components/visuals/VisualRenderer';

interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  time: string;
  actionTrigger?: string;
  actionPayload?: any;
  visualSpec?: any;
  isDemoFallback?: boolean;
}

export const OpenLearningPage: React.FC = () => {
  const { user } = useAuth();
  const { playSound } = useSound();

  const [inputTopic, setInputTopic] = useState('');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [openTopicsList, setOpenTopicsList] = useState<Topic[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    'Python Functions',
    'Data Structures (Arrays & Trees)',
    'Machine Learning Basics',
    'Operating Systems & Scheduling',
    'Digital Electronics & Logic Gates',
    'Thermodynamics Laws',
    'Cybersecurity Principles',
    'Calculus: Derivatives',
  ];

  const tutorCommandChips = [
    'Explain this again',
    'Make it easier',
    'Give me an example',
    'Explain using an analogy',
    'Why is my answer wrong?',
    'Give me another question',
    'Test me',
  ];

  useEffect(() => {
    api.getOpenTopics().then((list) => {
      setOpenTopicsList(list);
      if (list.length > 0 && !activeTopic) {
        setActiveTopic(list[0]);
      }
    });

    // Default welcome message
    setMessages([
      {
        id: 'welcome',
        sender: 'tutor',
        text: `Hello ${user?.username || 'Scholar'}! 👋 I am your Adaptive AI Tutor. What would you like to master today? You can choose from the suggestion chips below or type any topic!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCreateTopic = async (topicText: string) => {
    if (!topicText.trim()) return;
    playSound('click');
    setInputTopic('');

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: `Let's learn: ${topicText}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const newTopic = await api.createOpenTopic({
        topic_text: topicText,
        learner_type: user?.learner_type || 'general',
      });
      setActiveTopic(newTopic);
      setOpenTopicsList((prev) => [newTopic, ...prev.filter((t) => t.id !== newTopic.id)]);

      const tutorReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: `Great! I've structured **${newTopic.title}** into ${newTopic.subtopics?.length || 5} adaptive subtopics. Let's start by taking a quick diagnostic calibration to assess your baseline level!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTrigger: 'topic_created',
        actionPayload: newTopic,
      };
      setMessages((prev) => [...prev, tutorReply]);
      playSound('levelUp');
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        text: `I had trouble structuring that topic: ${err.message}. Showing available demo topics instead!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendTutorMessage = async (customText?: string) => {
    const textToSend = customText || inputTopic;
    if (!textToSend.trim()) return;

    playSound('click');
    setInputTopic('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const resp: TutorResponse = await api.sendTutorMessage({
        message: textToSend,
        topic_id: activeTopic?.id,
        subtopic_id: activeTopic?.subtopics?.[0]?.id,
        mode: 'open',
      });

      const tutorReply: ChatMessage = {
        id: resp.message_id || Date.now().toString(),
        sender: 'tutor',
        text: resp.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTrigger: resp.action_trigger || undefined,
        actionPayload: resp.action_payload || undefined,
        visualSpec: resp.visual_spec || undefined,
        isDemoFallback: resp.is_demo_fallback,
      };

      setMessages((prev) => [...prev, tutorReply]);
      playSound('correct');
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'tutor',
          text: `Error contacting tutor service: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 font-mono text-xs font-bold rounded-full border border-purple-500/30">
                Open Learning Mode
              </span>
              <span className="text-xs text-slate-400">Conversational AI Curriculum</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Adaptive Topic Tutor
            </h1>
          </div>

          {activeTopic && (
            <div className="flex items-center gap-3">
              <Link
                to={`/diagnostic/${activeTopic.id}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" /> Start Diagnostic
              </Link>
              <Link
                to={`/topic/${activeTopic.id}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                View Full Topic Hub
              </Link>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Brain className="w-3.5 h-3.5 text-purple-400" /> Quick Topics:
          </span>
          {suggestionChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleCreateTopic(chip)}
              className="px-3 py-1.5 bg-slate-900/80 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/60 text-slate-300 hover:text-purple-200 text-xs font-medium rounded-xl whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Main Grid: Chat Stream (8 cols) + Side Panel (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Stream (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col h-[650px]">
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.map((msg) => {
                const isTutor = msg.sender === 'tutor';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isTutor ? 'items-start' : 'items-start flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow ${
                        isTutor
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isTutor ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[85%] space-y-3`}>
                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                          isTutor
                            ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* If tutor provided an interactive visual spec */}
                        {msg.visualSpec && (
                          <div className="mt-4 pt-3 border-t border-slate-700">
                            <VisualRenderer spec={msg.visualSpec} />
                          </div>
                        )}

                        {/* Interactive In-Chat Action Cards */}
                        {msg.actionTrigger === 'topic_created' && msg.actionPayload && (
                          <div className="mt-4 p-3.5 bg-slate-950/70 border border-purple-500/40 rounded-xl space-y-2">
                            <span className="text-[11px] font-bold text-purple-300 font-mono block">
                              📚 Structured Subtopics:
                            </span>
                            <div className="space-y-1.5">
                              {msg.actionPayload.subtopics?.map((sub: any, idx: number) => (
                                <div
                                  key={sub.id || idx}
                                  className="flex items-center justify-between text-xs text-slate-300 py-1 border-b border-slate-800/60 last:border-0"
                                >
                                  <span>
                                    {idx + 1}. {sub.title}
                                  </span>
                                  <StatusPill status="unassessed" size="sm" />
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 flex gap-2">
                              <Link
                                to={`/diagnostic/${msg.actionPayload.id}`}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg text-center shadow transition-colors"
                              >
                                Launch Diagnostic Calibration →
                              </Link>
                            </div>
                          </div>
                        )}

                        <div className="mt-1 flex items-center justify-between text-[10px] opacity-60 font-mono">
                          <span>{msg.time}</span>
                          {msg.isDemoFallback && (
                            <span className="text-amber-400 font-semibold">Demo Scripted Response</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/50 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-2xl text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 font-mono">Tutor is analyzing mastery & crafting reply...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Tutor Commands Bar */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  Ask Tutor:
                </span>
                {tutorCommandChips.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendTutorMessage(cmd)}
                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-950/70 border border-slate-700 text-slate-300 hover:text-indigo-300 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendTutorMessage();
                }}
                className="flex items-center gap-2 mt-2"
              >
                <input
                  type="text"
                  value={inputTopic}
                  onChange={(e) => setInputTopic(e.target.value)}
                  placeholder="Ask a question or type a new topic (e.g., 'Explain recursion with an analogy')..."
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputTopic.trim() || isTyping}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Side Panel: Active Topic Mastery & History (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Active Topic Card */}
            {activeTopic ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">
                      Active Curriculum
                    </span>
                    <h3 className="text-base font-bold text-white">{activeTopic.title}</h3>
                  </div>
                  <StatusPill mastery={activeTopic.overall_mastery || 0} size="sm" />
                </div>

                <div className="space-y-3 mb-6">
                  {activeTopic.subtopics?.map((sub, i) => (
                    <div key={sub.id || i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium truncate max-w-[180px]">
                          {i + 1}. {sub.title}
                        </span>
                        <StatusPill mastery={sub.mastery || 0} status={sub.status} size="sm" />
                      </div>
                      <MasteryBar mastery={sub.mastery || 0} size="sm" showPercentage={false} />
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <Link
                    to={`/diagnostic/${activeTopic.id}`}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow"
                  >
                    <Compass className="w-3.5 h-3.5" /> Start Topic Diagnostic
                  </Link>
                  <Link
                    to={`/test/${activeTopic.id}`}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Take Adaptive MCQ Test
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs">
                Select or create a topic to view its real-time mastery tree.
              </div>
            )}

            {/* Past Resumable Topics */}
            {openTopicsList.length > 1 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Resumable Open Topics:
                </h4>
                <div className="space-y-2">
                  {openTopicsList.slice(0, 4).map((top) => (
                    <button
                      key={top.id}
                      onClick={() => {
                        setActiveTopic(top);
                        playSound('click');
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${
                        activeTopic?.id === top.id
                          ? 'bg-purple-950/60 border-purple-500/80 text-white'
                          : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-semibold truncate">{top.title}</span>
                      <StatusPill mastery={top.overall_mastery || 0} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
