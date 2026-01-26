import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  generateCompetitiveAnalysis,
  CompetitiveAnalysis,
  PerformanceBenchmark
} from '../services/competitiveInsightsService';

interface CompetitiveInsightsProps {
  creatorId: string;
  creatorName: string;
  category: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  currentPrice: number;
}

const CompetitiveInsights: React.FC<CompetitiveInsightsProps> = ({
  creatorId,
  creatorName,
  category,
  skills,
  rating,
  completedProjects,
  currentPrice
}) => {
  const [analysis, setAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [creatorId]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const data = await generateCompetitiveAnalysis(
        creatorId,
        category,
        skills,
        rating,
        completedProjects,
        currentPrice
      );
      setAnalysis(data);
    } catch (error) {
      console.error('Error loading competitive analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalysis();
    setRefreshing(false);
  };

  const getPositionColor = (position: CompetitiveAnalysis['marketPosition']) => {
    switch (position) {
      case 'LEADER': return 'text-purple-600 bg-purple-100';
      case 'STRONG': return 'text-blue-600 bg-blue-100';
      case 'AVERAGE': return 'text-yellow-600 bg-yellow-100';
      case 'EMERGING': return 'text-green-600 bg-green-100';
      case 'NEW': return 'text-gray-600 bg-gray-100';
    }
  };

  const getPositionIcon = (position: CompetitiveAnalysis['marketPosition']) => {
    switch (position) {
      case 'LEADER': return <Award className="w-5 h-5" />;
      case 'STRONG': return <TrendingUp className="w-5 h-5" />;
      case 'AVERAGE': return <Activity className="w-5 h-5" />;
      case 'EMERGING': return <Sparkles className="w-5 h-5" />;
      case 'NEW': return <Zap className="w-5 h-5" />;
    }
  };

  const getBenchmarkStatusColor = (status: PerformanceBenchmark['status']) => {
    switch (status) {
      case 'EXCELLENT': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'GOOD': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'AVERAGE': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'BELOW_AVERAGE': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'NEEDS_IMPROVEMENT': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Unable to load competitive insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">Competitive Analysis</h3>
            <p className="text-sm opacity-90">Market intelligence for {category}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <Activity className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-75 mb-1">Competitiveness Score</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{analysis.competitivenessScore}</span>
              <span className="text-xl opacity-75 mb-1">/100</span>
            </div>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Market Position</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${getPositionColor(analysis.marketPosition).replace('text-', 'bg-').replace('bg-', 'text-')} bg-white`}>
              {getPositionIcon(analysis.marketPosition)}
              {analysis.marketPosition}
            </div>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Market Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{analysis.marketInsights.totalActiveCreators}</p>
            <p className="text-xs text-gray-600">Active Creators</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">+{analysis.marketInsights.marketGrowth}%</p>
            <p className="text-xs text-gray-600">Market Growth</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Award className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{analysis.marketInsights.averageRating.toFixed(1)}</p>
            <p className="text-xs text-gray-600">Avg Rating</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analysis.marketInsights.averageProjectValue)}</p>
            <p className="text-xs text-gray-600">Avg Project</p>
          </div>
        </div>

        {analysis.marketInsights.topSkills.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Top In-Demand Skills:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.marketInsights.topSkills.slice(0, 6).map(skill => (
                <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance Benchmarks */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Performance Benchmarks
        </h3>
        
        <div className="space-y-4">
          {analysis.performanceBenchmarks.map((benchmark, index) => (
            <div key={index} className={`p-4 border-2 rounded-lg ${getBenchmarkStatusColor(benchmark.status)}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{benchmark.metric}</h4>
                  <p className="text-sm opacity-75 mt-1">{benchmark.recommendation}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-white/50 rounded">
                  {benchmark.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <p className="text-xs opacity-75">Your Value</p>
                  <p className="font-bold">
                    {benchmark.metric.includes('$') 
                      ? formatCurrency(benchmark.yourValue)
                      : benchmark.yourValue.toFixed(benchmark.metric.includes('%') ? 0 : 1)}
                    {benchmark.metric.includes('%') && '%'}
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Market Avg</p>
                  <p className="font-bold">
                    {benchmark.metric.includes('$') 
                      ? formatCurrency(benchmark.marketAverage)
                      : benchmark.marketAverage.toFixed(benchmark.metric.includes('%') ? 0 : 1)}
                    {benchmark.metric.includes('%') && '%'}
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Percentile</p>
                  <p className="font-bold flex items-center gap-1">
                    {Math.round(benchmark.percentile)}%
                    {benchmark.percentile >= 70 ? (
                      <ArrowUp className="w-3 h-3 text-green-600" />
                    ) : benchmark.percentile < 50 ? (
                      <ArrowDown className="w-3 h-3 text-red-600" />
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Recommendations */}
      {analysis.pricingRecommendations.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Pricing Intelligence
          </h3>
          
          {analysis.pricingRecommendations.map((pricing, index) => (
            <div key={index} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Your Price</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(pricing.yourCurrentPrice)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Market Average</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(pricing.marketAverage)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-600 mb-1">Suggested Range</p>
                  <p className="text-xl font-bold text-emerald-900">
                    {formatCurrency(pricing.suggestedMinPrice)} - {formatCurrency(pricing.suggestedMaxPrice)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">Confidence</p>
                  <p className="text-xl font-bold text-purple-900">{pricing.confidence}%</p>
                </div>
              </div>
              
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-indigo-900 mb-2">Pricing Insights:</p>
                <ul className="space-y-1">
                  {pricing.reasoning.map((reason, idx) => (
                    <li key={idx} className="text-sm text-indigo-800 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SWOT Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths.length > 0 ? (
              analysis.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-emerald-800 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                  {strength}
                </li>
              ))
            ) : (
              <li className="text-sm text-emerald-600">Building your strengths...</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.weaknesses.length > 0 ? (
              analysis.weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                  {weakness}
                </li>
              ))
            ) : (
              <li className="text-sm text-red-600">No major weaknesses identified!</li>
            )}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Opportunities
          </h3>
          <ul className="space-y-2">
            {analysis.opportunities.map((opportunity, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                {opportunity}
              </li>
            ))}
          </ul>
        </div>

        {/* Threats */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Competitive Threats
          </h3>
          <ul className="space-y-2">
            {analysis.threats.map((threat, idx) => (
              <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0"></span>
                {threat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top Competitors */}
      {analysis.topCompetitors.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Top Competitors to Watch
          </h3>
          
          <div className="space-y-3">
            {analysis.topCompetitors.map((competitor, index) => (
              <div key={competitor.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                    <p className="text-sm text-gray-600">{competitor.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Award className="w-4 h-4" />
                      <span className="font-bold">{competitor.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{competitor.totalProjects} projects</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {competitor.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-white text-gray-700 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Avg: {formatCurrency(competitor.averagePrice)}</span>
                  <span>•</span>
                  <span>Response: {competitor.responseTime}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitiveInsights;
