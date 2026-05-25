import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Activity, 
  Smile, 
  Frown, 
  Zap, 
  Minus, 
  Award, 
  AlertTriangle, 
  Compass, 
  ArrowRight,
  Database,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Emotion, AnalysisResult } from '../types';

interface EmotionDashboardProps {
  history: AnalysisResult[];
  onSeedDemoData: () => void;
  onClearHistory: () => void;
  onNavigateToAnalysis: () => void;
}

const EMOTION_META: Record<Emotion, { label: string; color: string; bg: string; border: string; iconBg: string; textColor: string; gradient: string }> = {
  Happy: { 
    label: 'Happy', 
    color: '#10b981', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-100', 
    iconBg: 'bg-emerald-100 text-emerald-700',
    textColor: 'text-emerald-700',
    gradient: 'from-emerald-400 to-teal-500'
  },
  Neutral: { 
    label: 'Neutral', 
    color: '#64748b', 
    bg: 'bg-slate-50', 
    border: 'border-slate-100', 
    iconBg: 'bg-slate-100 text-slate-600',
    textColor: 'text-slate-600',
    gradient: 'from-slate-400 to-slate-500'
  },
  Stress: { 
    label: 'Stress', 
    color: '#f97316', 
    bg: 'bg-orange-50', 
    border: 'border-orange-100', 
    iconBg: 'bg-orange-100 text-orange-700',
    textColor: 'text-orange-700',
    gradient: 'from-orange-400 to-amber-500'
  },
  Sad: { 
    label: 'Sad', 
    color: '#3b82f6', 
    bg: 'bg-blue-50', 
    border: 'border-blue-100', 
    iconBg: 'bg-blue-100 text-blue-700',
    textColor: 'text-blue-700',
    gradient: 'from-blue-400 to-indigo-500'
  }
};

const EMOTION_SCORES: Record<Emotion, number> = {
  Happy: 100,
  Neutral: 70,
  Stress: 40,
  Sad: 25
};

export default function EmotionDashboard({ 
  history, 
  onSeedDemoData, 
  onClearHistory,
  onNavigateToAnalysis 
}: EmotionDashboardProps) {
  const [hoveredWeekIndex, setHoveredWeekIndex] = useState<number | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // --- Real-Time Analytics Calculations ---
  const stats = useMemo(() => {
    const total = history.length;
    if (total === 0) {
      return {
        total: 0,
        dominantEmotion: 'Neutral' as Emotion,
        dominantPercentage: 0,
        dominantCount: 0,
        stressFrequency: 0,
        improvementRate: 0,
        isImproving: true,
        emotionDistribution: { Happy: 0, Sad: 0, Stress: 0, Neutral: 0 }
      };
    }

    // Counts
    const counts = { Happy: 0, Sad: 0, Stress: 0, Neutral: 0 };
    history.forEach(item => {
      counts[item.emotion] = (counts[item.emotion] || 0) + 1;
    });

    // Dominant Emotion
    let dominantEmotion: Emotion = 'Neutral';
    let maxCount = -1;
    (Object.keys(counts) as Emotion[]).forEach(e => {
      if (counts[e] > maxCount) {
        maxCount = counts[e];
        dominantEmotion = e;
      }
    });

    const dominantPercentage = Math.round((maxCount / total) * 100);
    const stressFrequency = Math.round((counts.Stress / total) * 100);

    // Emotional Improvement Rate
    // Compare historical progression of averages: chronologically sorting items
    const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const midpoint = Math.floor(sortedHistory.length / 2);
    
    let improvementRate = 0;
    let isImproving = true;

    if (sortedHistory.length >= 2) {
      const firstHalf = sortedHistory.slice(0, midpoint);
      const secondHalf = sortedHistory.slice(midpoint);

      const calcAverageScore = (arr: AnalysisResult[]) => {
        if (arr.length === 0) return 0;
        const totalScore = arr.reduce((sum, item) => sum + EMOTION_SCORES[item.emotion], 0);
        return totalScore / arr.length;
      };

      const firstAvg = calcAverageScore(firstHalf);
      const secondAvg = calcAverageScore(secondHalf);

      if (firstAvg === 0) {
        improvementRate = 0;
      } else {
        const diff = secondAvg - firstAvg;
        // Map change onto a realistic percentage scale
        improvementRate = Math.min(100, Math.max(0, Math.round(50 + (diff / 100) * 50)));
        isImproving = secondAvg >= firstAvg;
      }
    } else {
      // Settle on default neutral baseline
      improvementRate = 50;
      isImproving = true;
    }

    return {
      total,
      dominantEmotion,
      dominantPercentage,
      dominantCount: maxCount,
      stressFrequency,
      improvementRate,
      isImproving,
      emotionDistribution: counts
    };
  }, [history]);

  // --- Dynamic Dashboard Widgets Visual Aggregation ---

  // 1. Weekly Emotion Trend (Past 7 Days Mapping)
  const weeklyTrendData = useMemo(() => {
    // Generate the last 7 calendar days starting from local timezone
    const resultDays = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateKey = d.toDateString(); // Unified date match key
      
      resultDays.push({
        dayName: dayStr,
        dateString: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateKey,
        score: 70, // default baseline
        count: 0,
        emotions: [] as Emotion[]
      });
    }

    // Map logs to matching dates
    history.forEach(item => {
      const itemDateKey = new Date(item.timestamp).toDateString();
      const matchDay = resultDays.find(d => d.dateKey === itemDateKey);
      if (matchDay) {
        matchDay.count += 1;
        matchDay.emotions.push(item.emotion);
      }
    });

    // Recalculate each day's overall well-being index
    resultDays.forEach(day => {
      if (day.count > 0) {
        const sumScores = day.emotions.reduce((sum, emo) => sum + EMOTION_SCORES[emo], 0);
        day.score = Math.round(sumScores / day.count);
      } else {
        day.score = 65; // realistic ambient emotional score (around neutral)
      }
    });

    return resultDays;
  }, [history]);

  // 2. Monthly Emotional Changes (Weeks 1 to 4 stacked comparison)
  const monthlyChangesWeeks = useMemo(() => {
    const weeks = [
      { name: 'Week 1', Happy: 0, Sad: 0, Stress: 0, Neutral: 0, total: 0 },
      { name: 'Week 2', Happy: 0, Sad: 0, Stress: 0, Neutral: 0, total: 0 },
      { name: 'Week 3', Happy: 0, Sad: 0, Stress: 0, Neutral: 0, total: 0 },
      { name: 'Week 4', Happy: 0, Sad: 0, Stress: 0, Neutral: 0, total: 0 }
    ];

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    history.forEach(item => {
      const msDiff = now - item.timestamp;
      let weekIdx = Math.floor(msDiff / oneWeekMs);
      
      // Limit to last 4 weeks
      if (weekIdx >= 0 && weekIdx < 4) {
        // Since weekIdx = 0 is the current week, let's reverse so Week 4 is the most recent
        const mappedWeekIdx = 3 - weekIdx;
        weeks[mappedWeekIdx][item.emotion] += 1;
        weeks[mappedWeekIdx].total += 1;
      }
    });

    // If completely empty history, provide a flat scale, otherwise use calculated values
    return weeks;
  }, [history]);

  // SVG Helper measurements
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Render Line Trend Path
  const points = useMemo(() => {
    const usableWidth = chartWidth - paddingX * 2;
    const usableHeight = chartHeight - paddingY * 2;
    
    return weeklyTrendData.map((data, idx) => {
      const x = paddingX + (idx / (weeklyTrendData.length - 1)) * usableWidth;
      // Mirror score (100 is top, 0 is bottom)
      const y = paddingY + usableHeight - (data.score / 100) * usableHeight;
      return { x, y, score: data.score, dayName: data.dayName, count: data.count };
    });
  }, [weeklyTrendData]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const baselineY = chartHeight - paddingY;
    
    return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
  }, [points, linePath]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 font-sans" id="analytics_dashboard">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5" /> Self-Reflection Diagnostics
          </span>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Emotion Analytics Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Deep insights mapping your subjective well-being over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {history.length > 0 ? (
            <button 
              onClick={onClearHistory}
              className="flex items-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          ) : (
            <button 
              onClick={onSeedDemoData}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-100 hover:shadow-xl hover:scale-[1.02] active:scale-95 duration-200 rounded-xl text-sm font-semibold"
            >
              <Database className="w-4 h-4" />
              Seed Mock Analytics Data
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        // Empty State prompting to analyze or seed
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm max-w-2xl mx-auto px-6">
          <Calendar className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Emotional Intel Extracted Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Track daily check-ins on our Analysis page, or load a set of premium sample analytics with one click to preview the visual dashboards immediately.
          </p>
          <div className="flex justify-center items-center gap-4">
            <button 
              onClick={onSeedDemoData}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 hover:shadow-lg transition-all"
            >
              <Database className="w-4 h-4" /> Seed Premium Data
            </button>
            <button 
              onClick={onNavigateToAnalysis}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
            >
              Analyse Live Mood <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TOP METRIC / STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: Most Detected Emotion */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Most Detected</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">
                    {stats.dominantEmotion}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl ${EMOTION_META[stats.dominantEmotion].iconBg}`}>
                  {stats.dominantEmotion === 'Happy' && <Smile className="w-6 h-6" />}
                  {stats.dominantEmotion === 'Sad' && <Frown className="w-6 h-6" />}
                  {stats.dominantEmotion === 'Stress' && <Zap className="w-6 h-6" />}
                  {stats.dominantEmotion === 'Neutral' && <Minus className="w-6 h-6" />}
                </div>
              </div>

              <div>
                <div className="flex gap-2 items-baseline mb-2">
                  <span className="text-3xl font-bold text-slate-800">{stats.dominantPercentage}%</span>
                  <span className="text-slate-400 text-xs">({stats.dominantCount} of {stats.total} entries)</span>
                </div>
                {/* Horizontal Progress bar for dominant emotion */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${stats.dominantPercentage}%`,
                      backgroundColor: EMOTION_META[stats.dominantEmotion].color 
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  {stats.dominantEmotion === 'Happy' && "Outstanding well-being balance. Keep up the high energy!"}
                  {stats.dominantEmotion === 'Stress' && "Prioritize breaks, breathing cycles & slow down routines."}
                  {stats.dominantEmotion === 'Sad' && "Gently allow feelings to flow; request support or journal."}
                  {stats.dominantEmotion === 'Neutral' && "Stable, balanced emotional baseline. Good daily peace."}
                </p>
              </div>
            </div>

            {/* CARD 2: Stress Frequency */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Stress Frequency</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">
                    {stats.stressFrequency < 25 ? 'Low Stress' : stats.stressFrequency < 50 ? 'Moderate' : 'High Tension'}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl ${stats.stressFrequency > 40 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                  <Zap className="w-6 h-6" />
                </div>
              </div>

              <div>
                <div className="flex gap-2 items-baseline mb-2">
                  <span className={`text-3xl font-bold ${stats.stressFrequency > 40 ? 'text-orange-600' : 'text-slate-800'}`}>
                    {stats.stressFrequency}%
                  </span>
                  <span className="text-slate-400 text-xs">of check-ins</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${stats.stressFrequency}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  {stats.stressFrequency < 25 && "Your nervous system stands in a highly rested, safe state."}
                  {stats.stressFrequency >= 25 && stats.stressFrequency <= 50 && "Mild periodic stressors mapped. Standard load levels."}
                  {stats.stressFrequency > 50 && "High acute pressure clusters found. Try grounding routines."}
                </p>
              </div>
            </div>

            {/* CARD 4: Check-in Cadence */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4 font-sans">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5 font-sans">Check-in Cadence</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">Active State</p>
                </div>
                <div className="p-3 bg-sky-100 rounded-2xl text-sky-700">
                  <Compass className="w-6 h-6" />
                </div>
              </div>

              <div>
                <div className="flex gap-2 items-baseline mb-2">
                  <span className="text-3xl font-bold text-sky-600">{stats.total}</span>
                  <span className="text-slate-400 text-xs">saved check-ins</span>
                </div>
                <div className="flex gap-1">
                  {/* Visual tracker tick indicators */}
                  {Array.from({ length: Math.min(10, stats.total) }).map((_, idx) => (
                    <div key={idx} className="flex-1 h-2 rounded-full bg-sky-500" />
                  ))}
                  {stats.total > 10 && <div className="text-[10px] text-sky-500 font-bold ml-1">+{(stats.total - 10)}</div>}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Reflective habits build deep structural awareness. Splendid effort.
                </p>
              </div>
            </div>

          </div>

          {/* CHARTS CONTAINER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* WEEKLY TREND CHART: Well-being Index Line/Area SVG */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Weekly Emotion Trend</h3>
                  <p className="text-xs text-slate-400 font-medium">Well-being Score mapped over past 7 calendar dates</p>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Avg. score
                  </div>
                </div>
              </div>

              {/* Responsive SVG Container for custom line chart */}
              <div className="relative w-full overflow-hidden">
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    {/* Sky blue gradient */}
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 25, 50, 75, 100].map((level, i) => {
                    const usableHeight = chartHeight - paddingY * 2;
                    const y = paddingY + usableHeight - (level / 100) * usableHeight;
                    return (
                      <g key={level} className="opacity-40">
                        <line 
                          x1={paddingX} 
                          y1={y} 
                          x2={chartWidth - paddingX} 
                          y2={y} 
                          stroke="#e2e8f0" 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={paddingX - 8} 
                          y={y + 4} 
                          textAnchor="end" 
                          className="font-mono text-[9px] fill-slate-400 font-semibold"
                        >
                          {level === 100 ? '100 (Max Happy)' : level === 0 ? '0' : level}
                        </text>
                      </g>
                    );
                  })}

                  {/* The Fill Area Path */}
                  <path 
                    d={areaPath} 
                    fill="url(#areaGradient)" 
                    className="transition-all duration-700 ease-out"
                  />

                  {/* Main Trend Line */}
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="#0284c7" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="transition-all duration-700 ease-out"
                  />

                  {/* Intersecting Dots */}
                  {points.map((p, idx) => {
                    const isHovered = hoveredDayIndex === idx;
                    return (
                      <g key={idx}>
                        {/* Interactive hover halo */}
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r={isHovered ? 14 : 7} 
                          fill="#0284c7" 
                          className="fill-sky-100 opacity-50 cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredDayIndex(idx)}
                          onMouseLeave={() => setHoveredDayIndex(null)}
                        />
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="4.5" 
                          fill="#ffffff" 
                          stroke="#0284c7" 
                          strokeWidth="3" 
                          className="cursor-pointer"
                        />
                      </g>
                    );
                  })}

                  {/* Day Axis label */}
                  {points.map((p, idx) => (
                    <text 
                      key={idx} 
                      x={p.x} 
                      y={chartHeight - 8} 
                      textAnchor="middle" 
                      className="font-bold text-[10px] fill-slate-500 font-sans"
                    >
                      {p.dayName}
                    </text>
                  ))}
                </svg>

                {/* DOM-based Tooltip anchored above hovered element */}
                <AnimatePresence>
                  {hoveredDayIndex !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[85px] bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-xl text-center pointer-events-none z-20 w-44"
                      style={{
                        left: `${(hoveredDayIndex / (weeklyTrendData.length - 1)) * 82 + 9}%`
                      }}
                    >
                      <p className="font-bold text-xs mb-0.5">{weeklyTrendData[hoveredDayIndex].dateString}</p>
                      <div className="flex items-center gap-1.5 justify-center mb-1">
                        <span className="text-sky-300 font-mono text-[11px] font-bold">Well-being Score:</span>
                        <span className="text-white text-xs font-black">{weeklyTrendData[hoveredDayIndex].score}/100</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-tight">
                        {weeklyTrendData[hoveredDayIndex].count} check-ins recorded
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mini Diagnostic score breakdown details */}
              <div className="mt-4 bg-slate-50 rounded-2xl p-4 flex justify-between items-center text-xs font-medium text-slate-500 border border-slate-100/50">
                <span className="flex items-center gap-1"><Smile className="w-4 h-4 text-emerald-500" /> Happy (100)</span>
                <span className="flex items-center gap-1"><Minus className="w-4 h-4 text-slate-400" /> Neutral (70)</span>
                <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-orange-500" /> Stress (40)</span>
                <span className="flex items-center gap-1"><Frown className="w-4 h-4 text-blue-500" /> Sad (25)</span>
              </div>
            </div>

            {/* MONTHLY CHANGES: Stacked Bar Chart SVG */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Monthly Emotional Changes</h3>
                  <p className="text-xs text-slate-400 font-medium font-sans">Compare check-in volume distribution by week</p>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-tight">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block" /> Happy</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-400 block" /> Neutral</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500 block" /> Stress</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 block" /> Sad</span>
                </div>
              </div>

              {/* Dynamic SVG Stacked Bar chart */}
              <div className="relative w-full">
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full h-auto overflow-visible"
                >
                  {/* Grid lines horizontal */}
                  {[0, 2, 4, 6, 8, 10].map((val) => {
                    const usableHeight = chartHeight - paddingY * 2;
                    const maxVal = Math.max(8, ...monthlyChangesWeeks.map(w => w.total));
                    const y = paddingY + usableHeight - (val / maxVal) * usableHeight;
                    return (
                      <g key={val} className="opacity-40">
                        <line 
                          x1={paddingX} 
                          y1={y} 
                          x2={chartWidth - paddingX} 
                          y2={y} 
                          stroke="#e2e8f0" 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                        />
                        <text 
                          x={paddingX - 8} 
                          y={y + 3} 
                          textAnchor="end" 
                          className="font-mono text-[9px] fill-slate-400 font-semibold"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Render Stacked Bars */}
                  {monthlyChangesWeeks.map((week, idx) => {
                    const barCount = monthlyChangesWeeks.length;
                    const usableWidth = chartWidth - paddingX * 2;
                    const usableHeight = chartHeight - paddingY * 2;
                    const maxVal = Math.max(8, ...monthlyChangesWeeks.map(w => w.total));
                    
                    const barWidth = 44;
                    const centerOffset = paddingX + (idx / (barCount - 1)) * (usableWidth - 80) + 40;
                    const x = centerOffset - barWidth / 2;
                    
                    // Emotion segments logic
                    const emotionsOrder: Emotion[] = ['Happy', 'Neutral', 'Stress', 'Sad'];
                    let currentYOffset = 0;

                    return (
                      <g 
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredWeekIndex(idx)}
                        onMouseLeave={() => setHoveredWeekIndex(null)}
                      >
                        {/* Background structural touch target bar */}
                        <rect 
                          x={x - 10} 
                          y={paddingY} 
                          width={barWidth + 20} 
                          height={usableHeight} 
                          fill="transparent" 
                        />

                        {/* Stacked bars */}
                        {emotionsOrder.map((emo) => {
                          const count = week[emo];
                          if (count === 0) return null;
                          
                          const segHeight = (count / maxVal) * usableHeight;
                          const baselineY = chartHeight - paddingY;
                          const segY = baselineY - currentYOffset - segHeight;
                          
                          currentYOffset += segHeight;

                          return (
                            <rect 
                              key={emo}
                              x={x}
                              y={segY}
                              width={barWidth}
                              height={segHeight}
                              fill={EMOTION_META[emo].color}
                              rx="3.5"
                              className="hover:brightness-95 transition-all duration-200"
                            />
                          );
                        })}

                        {/* Week Label text */}
                        <text 
                          x={centerOffset} 
                          y={chartHeight - 8} 
                          textAnchor="middle" 
                          className="font-bold text-[10px] fill-slate-500 font-sans"
                        >
                          {week.name}
                        </text>

                        {/* Active total indicator above bar */}
                        {week.total > 0 && (
                          <text 
                            x={centerOffset} 
                            y={chartHeight - paddingY - currentYOffset - 6} 
                            textAnchor="middle" 
                            className="font-mono text-[10px] font-bold fill-slate-700"
                          >
                            {week.total}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* DOM-based Stacked Bar Tooltip */}
                <AnimatePresence>
                  {hoveredWeekIndex !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-xl pointer-events-none z-20 w-48 text-xs font-sans"
                      style={{
                        left: `${(hoveredWeekIndex / (monthlyChangesWeeks.length - 1)) * 62 + 18}%`
                      }}
                    >
                      <p className="font-extrabold text-sm mb-2 border-b border-slate-800 pb-1.5 text-slate-100 flex items-center justify-between">
                        <span>{monthlyChangesWeeks[hoveredWeekIndex].name}</span>
                        <span className="text-sky-300 font-mono text-xs">{monthlyChangesWeeks[hoveredWeekIndex].total} total</span>
                      </p>
                      
                      <div className="space-y-1.5 font-bold">
                        <div className="flex justify-between items-center text-emerald-400">
                          <span>Happy</span>
                          <span className="font-mono">{monthlyChangesWeeks[hoveredWeekIndex].Happy}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Neutral</span>
                          <span className="font-mono">{monthlyChangesWeeks[hoveredWeekIndex].Neutral}</span>
                        </div>
                        <div className="flex justify-between items-center text-orange-400">
                          <span>Stress</span>
                          <span className="font-mono">{monthlyChangesWeeks[hoveredWeekIndex].Stress}</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-400">
                          <span>Sad</span>
                          <span className="font-mono">{monthlyChangesWeeks[hoveredWeekIndex].Sad}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* AI BIO-INTELLIGENT REFLECTIVE ADVISORY */}
          <div className="bg-gradient-to-r from-sky-500/5 to-indigo-500/5 rounded-3xl p-8 border border-sky-100 flex flex-col md:flex-row gap-6 items-center">
            <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl">
              <Compass className="w-10 h-10 animate-pulse" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-semibold text-slate-800 mb-1">Weekly Diagnostics Analytics Insight</h4>
              <p className="text-slate-500 text-sm leading-relaxed max-w-3xl">
                {stats.dominantEmotion === 'Happy' && "Your emotional progression is beautifully dominant in 'Happy' state checks, showing rich positive coping mechanisms. Leverage this peaceful frequency to solidify habits, physical exercises, and mindfulness logs."}
                {stats.dominantEmotion === 'Stress' && "The system identifies clusters of exam, alignment, and work workload pressure indicators triggering tension stress. Engage in immediate grounding exercises (such as the 5-4-3-2-1 body scan technique) before intense sessions."}
                {stats.dominantEmotion === 'Sad' && "Periods of loneliness or emotional heartbreak are gently registered. Normalise these states through kind psychoeducation. Consider checking in on your social networks or calling a supportive friend today."}
                {stats.dominantEmotion === 'Neutral' && "A highly centered, peaceful 'Neutral' presence guarantees deep recovery state baselines. It provides a clean, solid sheet for physical awareness and cognitive reframing."}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
