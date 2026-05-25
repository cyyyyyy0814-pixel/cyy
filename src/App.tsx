/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  History, 
  Home, 
  Send, 
  Brain, 
  Smile, 
  Frown, 
  Zap, 
  Minus,
  ArrowRight,
  RefreshCcw,
  Trash2,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Emotion, AnalysisResult, Page, TimeRange } from './types';
import EmotionDashboard from './components/EmotionDashboard';

// --- Constants ---

const EMOTION_COLORS: Record<Emotion, string> = {
  Stress: 'bg-orange-100 text-orange-700 border-orange-200',
  Sad: 'bg-blue-100 text-blue-700 border-blue-200',
  Happy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

const EMOTION_ICONS: Record<Emotion, React.ReactNode> = {
  Stress: <Zap className="w-6 h-6" />,
  Sad: <Frown className="w-6 h-6" />,
  Happy: <Smile className="w-6 h-6" />,
  Neutral: <Minus className="w-6 h-6" />,
};

// --- App Component ---

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('mindease_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('mindease_history', JSON.stringify(history));
  }, [history]);

  const analyzeEmotion = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Analysis failed");
      }
      const data = await response.json();

      const newResult: AnalysisResult = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        text: inputText,
        emotion: data.emotion as Emotion,
        feedback: data.feedback,
        suggestion: data.suggestion
      };

      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);
      setInputText('');
    } catch (error) {
      console.error("Analysis failed:", error);
      const mockResult: AnalysisResult = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        text: inputText,
        emotion: 'Neutral',
        feedback: "We couldn't reach the AI, but we're here for you.",
        suggestion: "Try taking a short walk or drinking some water."
      };
      setResult(mockResult);
      setHistory(prev => [mockResult, ...prev]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your history?")) {
      setHistory([]);
    }
  };

  const handleSeedDemoData = () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const predefinedLogSamples = [
      { text: "Had an amazing morning walk under the bright sun, feeling fully recharged.", emotion: 'Happy' as Emotion, feedback: "Splendid! Nature walking is an exceptional way to restore your physical core.", suggestion: "Enjoy this bright streak. Consider maintaining standard morning walks." },
      { text: "Got an outstanding grade on my final project! All the work paid off.", emotion: 'Happy' as Emotion, feedback: "Fantastic! Your deep, sustained efforts have yielded deserved success.", suggestion: "Celebrate your milestone. Appreciate your effort and commitment." },
      { text: "Spent quality time with some close childhood friends over dinner tonight.", emotion: 'Happy' as Emotion, feedback: "Beautiful! Constructive social circles build thick emotional insulation.", suggestion: "Keep nourishing these supportive links; planning another meetup." },
      { text: "Had a highly relaxing evening reading a book with some warm tea.", emotion: 'Happy' as Emotion, feedback: "Lovely. Unwinding calmly helps consolidate your physical resilience.", suggestion: "Continue setting aside regular time for quiet hobbies like reading." },
      { text: "Successfully finished sketching my new drawing. Felt highly creative.", emotion: 'Happy' as Emotion, feedback: "Wonderful. Art permits excellent alignment of creative thoughts.", suggestion: "Keep painting or sketching; it is a profound therapy channel." },
      
      { text: "The deadlines are piling up. I have three assignments due this Friday and I'm stressed.", emotion: 'Stress' as Emotion, feedback: "That sounds heavy, but remember that you can conquer this piece by piece.", suggestion: "Divide tasks into micro-deliverables. Take regular 5-minute deep breath breaks." },
      { text: "Struggling to sleep because my mind is race tracking with exam anxiety.", emotion: 'Stress' as Emotion, feedback: "We hear you. Racing thoughts before sleep show standard exam pressure.", suggestion: "Try the 5-4-3-2-1 technique or write down all tasks on paper before bed." },
      { text: "Very frustrated by the constant project changes. It feels too overwhelming.", emotion: 'Stress' as Emotion, feedback: "It is natural to feel stressed when targets shift constantly.", suggestion: "Focus strictly on what is under your control today; request structural sync." },
      { text: "Can't find my keys and I'm already late for my presentation.", emotion: 'Stress' as Emotion, feedback: "Panic spikes make organizing logical thoughts difficult.", suggestion: "Reset with three deep diaphragmatic breaths. Slow down; safety comes first." },
      { text: "Too much work stacked this weekend, feeling some burnout creep in.", emotion: 'Stress' as Emotion, feedback: "Burnout is a direct plea from your body requesting profound rest.", suggestion: "Set tight boundaries around work hours. Take a short walk or stretch." },

      { text: "I've been feeling deeply lonely lately, missing companionship.", emotion: 'Sad' as Emotion, feedback: "Loneliness is a heavy weight, but your feelings are fully validated.", suggestion: "Gently connect with an old peer or try writing down your raw thoughts." },
      { text: "Had a major disagreement with my cousin, feeling very down today.", emotion: 'Sad' as Emotion, feedback: "Conflict with loved ones creates temporary emotional wounds.", suggestion: "Give yourself time to heal. It is completely okay to feel sad." },
      { text: "Feeling like I failed to meet everyone's high expectations.", emotion: 'Sad' as Emotion, feedback: "You are enough exactly as you are. Expectations build unfair pressure.", suggestion: "Extend kindness to yourself. You are doing the absolute best you can." },
      { text: "Disappointed that our long-planned holiday trip got cancelled.", emotion: 'Sad' as Emotion, feedback: "Disappointment can feel highly disheartening. We hear you.", suggestion: "Treat yourself to a small local dish or favorite activity today." },
      { text: "Woke up with an inexplicable heavy emotion, missing my hometown.", emotion: 'Sad' as Emotion, feedback: "Nostalgia and homesickness are beautiful, heavy emotions.", suggestion: "Call a family member if possible, or browse old comforting pictures." },

      { text: "Ate lunch and did response emails. Standard quiet office morning.", emotion: 'Neutral' as Emotion, feedback: "Stable, calm, and grounded. This offers high daily daily peace.", suggestion: "Keep ticking off tasks steadily. Drink a glass of water." },
      { text: "Bought some household grocery items and cleaned up the kitchen desk.", emotion: 'Neutral' as Emotion, feedback: "Tidying up establishes order and peace in your surroundings.", suggestion: "Notice the comfort of neat, ordered environments." },
      { text: "Just waiting for the bus to arrive. Listening to a calm podcast.", emotion: 'Neutral' as Emotion, feedback: "Grounded in the present moment. Podcast learning is wonderful.", suggestion: "Rest your eyes while riding; take in the view from the window." },
      { text: "Doing some laundry while watching a nature documentary.", emotion: 'Neutral' as Emotion, feedback: "Calm weekend routines help restore structural body balance.", suggestion: "Squeeze in a 2-minute soft stretch between loads." },
      { text: "Attended normal class lectures today. Took some quick summaries.", emotion: 'Neutral' as Emotion, feedback: "Splendid work accumulating educational concepts.", suggestion: "Review key notes later, then shut the books for high-quality rest." }
    ];

    const distributedLogs = predefinedLogSamples.map((sample, index) => {
      const daysAgo = Math.floor((index / predefinedLogSamples.length) * 26);
      const randomHourOffset = Math.floor(Math.random() * 8) * 60 * 60 * 1000;
      const timestamp = now - (daysAgo * oneDayMs) - randomHourOffset;

      return {
        id: `seeded-${index}-${Math.random().toString(36).substring(4)}`,
        timestamp,
        text: sample.text,
        emotion: sample.emotion,
        feedback: sample.feedback,
        suggestion: sample.suggestion
      };
    });

    distributedLogs.sort((b, a) => b.timestamp - a.timestamp);
    setHistory(distributedLogs);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const getFilteredHistory = () => {
    if (timeRange === 'all') return history;
    
    const now = Date.now();
    const ranges = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    
    return history.filter(item => (now - item.timestamp) <= ranges[timeRange]);
  };

  // --- Render Helpers ---

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto text-center py-12 px-4"
    >
      <div className="mb-8 inline-flex p-4 bg-sky-100 rounded-full text-sky-600">
        <Brain className="w-12 h-12" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 tracking-tight">
        Your Emotional Well-being <br />
        <span className="text-sky-600 italic font-serif">Simplified.</span>
      </h1>
      <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
        MindEase helps you understand your feelings and provides gentle support suggestions. 
        A clean, private space for your mental health journey.
      </p>
      <button 
        onClick={() => setCurrentPage('analysis')}
        className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-sky-600 rounded-full hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-600"
      >
        Start Analysis
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { icon: <Smile className="text-emerald-500" />, title: "Detect Emotions", desc: "Understand if you're feeling happy, stressed, or sad." },
          { icon: <Heart className="text-rose-500" />, title: "Get Support", desc: "Receive tailored suggestions to improve your mood." },
          { icon: <History className="text-sky-500" />, title: "Track Progress", desc: "Look back at your emotional history over time." }
        ].map((feature, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="mb-4">{feature.icon}</div>
            <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
            <p className="text-slate-500 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderAnalysis = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto py-8 px-4"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">How are you feeling?</h2>
            <p className="text-slate-500 mb-6">Describe your thoughts or current mood in a few sentences.</p>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="I've been feeling a bit overwhelmed lately with all the assignments..."
              className="w-full h-64 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none mb-4 text-slate-700"
            />
            
            <button
              onClick={analyzeEmotion}
              disabled={isAnalyzing || !inputText.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                isAnalyzing || !inputText.trim() 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyze Emotion
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 h-full"
              >
                {/* Placeholder for Result/Feedback */}
                <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center min-h-[220px]">
                  <div className="bg-slate-50 p-3 rounded-full mb-3">
                    <Brain className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Emotion & Feedback</h3>
                  <p className="text-slate-300 text-sm">Waiting for your input...</p>
                </div>

                {/* Placeholder for Suggestions */}
                <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center min-h-[180px]">
                  <div className="bg-slate-50 p-3 rounded-full mb-3">
                    <Heart className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Support Suggestions</h3>
                  <p className="text-slate-300 text-sm">Suggestions will appear here.</p>
                </div>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 h-full"
              >
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[420px]">
                  <RefreshCcw className="w-10 h-10 text-sky-500 animate-spin mb-4" />
                  <p className="text-slate-600 font-bold">Tuning into your emotions...</p>
                  <p className="text-slate-400 text-sm mt-2">Our AI is carefully reflecting on your words.</p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div 
                key={result.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Result Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-2xl border shadow-sm ${EMOTION_COLORS[result.emotion]}`}>
                        {EMOTION_ICONS[result.emotion]}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Detected Emotion</span>
                        <h3 className="text-2xl font-bold text-slate-800">{result.emotion}</h3>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-sky-200 rounded-full" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">Feedback</h4>
                      <p className="text-slate-700 leading-relaxed text-lg italic font-serif ml-2">"{result.feedback}"</p>
                    </div>
                  </div>
                </div>

                {/* Suggestion Card */}
                <div className="bg-emerald-50 rounded-3xl shadow-lg shadow-emerald-100/50 border border-emerald-100 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <Heart className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Support Suggestions</h4>
                  </div>
                  <div className="text-emerald-800 font-medium leading-relaxed whitespace-pre-line">
                    {result.suggestion}
                  </div>
                </div>

                <div className="flex justify-between items-center px-4">
                  <span className="text-xs text-slate-400">Analysis complete</span>
                  <button 
                    onClick={() => {
                      setResult(null);
                      setInputText('');
                    }}
                    className="text-sm text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  const renderHistory = () => {
    const filteredHistory = getFilteredHistory();
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto py-8 px-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Your History</h2>
            <p className="text-slate-500">Review your past emotional states.</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit shadow-sm">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'week', label: 'Past Week' },
              { id: 'month', label: 'Past Month' },
              { id: 'year', label: 'Past Year' },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as TimeRange)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  timeRange === range.id 
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-100' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">
              {history.length === 0 ? "No analysis history yet." : "No records found for this time range."}
            </p>
            {history.length === 0 && (
              <button 
                onClick={() => setCurrentPage('analysis')}
                className="mt-4 text-sky-600 font-bold hover:underline"
              >
                Start your first analysis
              </button>
            )}
            {history.length > 0 && timeRange !== 'all' && (
              <button 
                onClick={() => setTimeRange('all')}
                className="mt-4 text-sky-600 font-bold hover:underline"
              >
                Show all history
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredHistory.map((item) => (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group"
              >
                <button 
                  onClick={() => deleteHistoryItem(item.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg border ${EMOTION_COLORS[item.emotion]}`}>
                    {React.cloneElement(EMOTION_ICONS[item.emotion] as React.ReactElement, { className: 'w-4 h-4' })}
                  </div>
                  <span className="font-bold text-slate-800">{item.emotion}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-slate-600 text-sm line-clamp-2 mb-4 italic">
                  "{item.text}"
                </p>
                
                <div className="text-xs bg-slate-50 p-3 rounded-lg text-slate-500">
                  <span className="font-bold block mb-1 text-slate-400">SUGGESTION:</span>
                  {item.suggestion}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setCurrentPage('home')}
          >
            <div className="bg-sky-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">MindEase</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
              { id: 'analysis', label: 'Analysis', icon: <Send className="w-4 h-4" /> },
              { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
              { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setCurrentPage(nav.id as Page)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  currentPage === nav.id ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {nav.icon}
                {nav.label}
              </button>
            ))}
          </div>

          {/* Mobile Nav Toggle (Simplified for this demo) */}
          <div className="md:hidden flex gap-4">
             <button onClick={() => setCurrentPage('analysis')} className="p-2 text-slate-500" title="Analysis"><Send className="w-5 h-5" /></button>
             <button onClick={() => setCurrentPage('history')} className="p-2 text-slate-500" title="History"><History className="w-5 h-5" /></button>
             <button onClick={() => setCurrentPage('dashboard')} className="p-2 text-slate-500" title="Dashboard"><Activity className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pb-20">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && renderHome()}
          {currentPage === 'analysis' && renderAnalysis()}
          {currentPage === 'history' && renderHistory()}
          {currentPage === 'dashboard' && (
            <EmotionDashboard 
              history={history} 
              onSeedDemoData={handleSeedDemoData}
              onClearHistory={clearHistory}
              onNavigateToAnalysis={() => setCurrentPage('analysis')} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
