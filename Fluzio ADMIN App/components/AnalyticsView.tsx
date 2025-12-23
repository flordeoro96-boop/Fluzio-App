import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getAnalytics, exportToCSV, calculateSummary, getTopPerformers, TimeSeriesData, SummaryStats, TopPerformer } from '../services/analyticsService';
import { X, Download, TrendingUp, TrendingDown, Calendar, BarChart3, Users, Target, Zap, Trophy, Medal, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnalyticsViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ isOpen, onClose, user }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPerformers, setLoadingPerformers] = useState(true);

  const businessMode = user.businessMode || 'PHYSICAL';

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
      loadTopPerformers();
    }
  }, [isOpen, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    const result = await getAnalytics(user.id, startDate, endDate);
    
    if (result.success && result.data) {
      setData(result.data);
      setSummary(calculateSummary(result.data));
    }
    setLoading(false);
  };

  const loadTopPerformers = async () => {
    setLoadingPerformers(true);
    const result = await getTopPerformers(user.id, 10);
    if (result.success && result.performers) {
      setTopPerformers(result.performers);
    }
    setLoadingPerformers(false);
  };

  const handleExport = () => {
    if (data) {
      const filename = `${user.name.replace(/\s+/g, '_')}_analytics_${timeRange}.csv`;
      exportToCSV(data, filename);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
        <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#00E5FF]" />
          Analytics
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm text-gray-700 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  timeRange === range
                    ? 'bg-[#00E5FF] text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Last {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-[#00E5FF] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase">Total Visits</span>
                    </div>
                    <div className="text-3xl font-clash font-bold text-[#1E0E62]">{summary.totalVisits}</div>
                    <div className="text-xs text-gray-500 mt-1">{summary.avgVisitsPerDay}/day avg</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase">Missions</span>
                    </div>
                    <div className="text-3xl font-clash font-bold text-[#1E0E62]">{summary.totalMissions}</div>
                    <div className="text-xs text-gray-500 mt-1">Completed</div>
                  </div>

                  {businessMode === 'ONLINE' && (
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <Target className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase">Conversions</span>
                      </div>
                      <div className="text-3xl font-clash font-bold text-[#1E0E62]">{summary.totalConversions}</div>
                      <div className="text-xs text-gray-500 mt-1">{summary.avgConversionRate}% rate</div>
                    </div>
                  )}

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                        {summary.growthRate >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase">Growth</span>
                    </div>
                    <div className={`text-3xl font-clash font-bold ${summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.growthRate >= 0 ? '+' : ''}{summary.growthRate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">vs previous period</div>
                  </div>
                </div>
              )}

              {/* Chart */}
              {data && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-[#1E0E62] mb-1 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#00E5FF]" />
                    Activity Over Time
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">Daily metrics for the selected period</p>
                  
                  {/* Simple Bar Chart */}
                  <div className="relative h-64">
                    <div className="absolute inset-0 flex items-end justify-between gap-1">
                      {data.visits.map((value, index) => {
                        const maxValue = Math.max(...data.visits);
                        const height = (value / maxValue) * 100;
                        const showLabel = data.labels.length <= 30 && index % (Math.ceil(data.labels.length / 7)) === 0;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full relative group">
                              <div
                                className="w-full bg-gradient-to-t from-[#00E5FF] to-[#6C4BFF] rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                                style={{ height: `${height}%`, minHeight: '4px' }}
                                title={`${data.labels[index]}: ${value} visits`}
                              ></div>
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {data.labels[index]}: {value}
                              </div>
                            </div>
                            {showLabel && (
                              <span className="text-[9px] text-gray-400 font-medium rotate-45 origin-top-left mt-2">
                                {data.labels[index]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-8 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF]"></div>
                      <span className="text-gray-600 font-medium">Visits</span>
                    </div>
                    {summary && (
                      <div className="text-gray-400">
                        Peak: {summary.topDay} ({Math.max(...data.visits)} visits)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Insights */}
              <div className="bg-gradient-to-br from-[#00E5FF]/10 to-[#6C4BFF]/10 p-6 rounded-2xl border border-[#00E5FF]/20">
                <h3 className="font-bold text-[#1E0E62] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00E5FF]" />
                  AI Insights
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {summary && summary.totalMissions > 0 && (
                    <p>🎯 <strong>Mission success:</strong> {summary.totalMissions} mission{summary.totalMissions > 1 ? 's' : ''} completed! Your creators are engaged.</p>
                  )}
                  {summary && summary.growthRate > 5 && (
                    <p>🎉 <strong>Great growth!</strong> Your visits are up {summary.growthRate.toFixed(1)}% compared to the previous period.</p>
                  )}
                  {summary && summary.growthRate < -5 && (
                    <p>📉 <strong>Activity dip:</strong> Visits are down {Math.abs(summary.growthRate).toFixed(1)}%. Consider launching new missions to boost engagement.</p>
                  )}
                  {summary && summary.avgConversionRate > 0 && (
                    <p>💰 <strong>Conversion rate:</strong> {summary.avgConversionRate.toFixed(1)}% of applicants are completing missions successfully.</p>
                  )}
                  {summary && summary.totalVisits > 10 && (
                    <p>👥 <strong>Active community:</strong> {summary.totalVisits} mission applications in this period!</p>
                  )}
                  {summary && summary.avgVisitsPerDay >= 1 && (
                    <p>📊 <strong>Daily average:</strong> {summary.avgVisitsPerDay.toFixed(1)} applications per day.</p>
                  )}
                  {summary && summary.totalVisits === 0 && summary.totalMissions === 0 && (
                    <p>💡 <strong>Getting started:</strong> Launch missions to attract creators and build engagement!</p>
                  )}
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-[#1E0E62] mb-1 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#00E5FF]" />
                  Top Mission Achievers
                </h3>
                <p className="text-xs text-gray-500 mb-6">Your most active creators and customers</p>
                
                {loadingPerformers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-[#00E5FF] border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading top performers...</p>
                  </div>
                ) : topPerformers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No mission completions yet</p>
                    <p className="text-gray-400 text-xs mt-1">Launch missions to see top performers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPerformers.map((performer, index) => {
                      const isTop3 = index < 3;
                      const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];
                      const bgColors = ['bg-yellow-50', 'bg-gray-50', 'bg-orange-50'];
                      
                      return (
                        <div
                          key={performer.userId}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                            isTop3 
                              ? `${bgColors[index]} border-${medalColors[index].split('-')[1]}-200` 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                            {isTop3 ? (
                              index === 0 ? (
                                <Trophy className={`w-6 h-6 ${medalColors[0]}`} />
                              ) : index === 1 ? (
                                <Medal className={`w-6 h-6 ${medalColors[1]}`} />
                              ) : (
                                <Award className={`w-6 h-6 ${medalColors[2]}`} />
                              )
                            ) : (
                              <span className="text-sm font-bold text-gray-400">#{performer.rank}</span>
                            )}
                          </div>

                          {/* Avatar */}
                          <img
                            src={performer.userAvatar}
                            alt={performer.userName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#1E0E62] text-sm truncate">
                              {performer.userName}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-600 font-medium">
                                🎯 {performer.missionsCompleted} missions
                              </span>
                              <span className="text-xs text-gray-600 font-medium">
                                ⚡ {performer.totalPoints} points
                              </span>
                            </div>
                          </div>

                          {/* Badge */}
                          {isTop3 && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                              index === 0 
                                ? 'bg-yellow-500 text-white' 
                                : index === 1 
                                ? 'bg-gray-400 text-white' 
                                : 'bg-orange-600 text-white'
                            }`}>
                              Top {index + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
