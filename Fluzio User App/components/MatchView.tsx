
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, StrategicMatch, BusinessGoal } from '../types';
import { store } from '../services/mockStore';
import { findStrategicMatches } from '../services/openaiService';
import { Card, Button, Select, Badge, Modal } from './Common';
import { Sparkles, Building2, Handshake, ArrowRight, MapPin, Lock, Globe, ChevronDown, Info, Target } from 'lucide-react';
import { HelpSheet } from './HelpSheet';

interface MatchViewProps {
  user: User;
}

const LocationHeader: React.FC<{ user: User; onUpgrade: () => void }> = ({ user, onUpgrade }) => {
    const isGlobal = user.subscriptionScope === 'GLOBAL';
    const city = user.homeCity || 'Unknown';

    return (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isGlobal ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    {isGlobal ? <Globe className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Search Location</div>
                    <div className="font-bold text-[#1E0E62] flex items-center gap-1">
                        {isGlobal ? 'Global Network' : `${city}, Germany`}
                        {!isGlobal && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                </div>
            </div>

            {!isGlobal ? (
                <Button size="sm" variant="ghost" className="text-xs text-pink-600 bg-pink-50 hover:bg-pink-100" onClick={onUpgrade}>
                    Change City
                </Button>
            ) : (
                 <Button size="sm" variant="ghost" className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
                    Filter <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
            )}
        </div>
    );
};

export const MatchView: React.FC<MatchViewProps> = ({ user }) => {
    const [matches, setMatches] = useState<StrategicMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeGoal, setActiveGoal] = useState<BusinessGoal>(user.activeGoal?.type || 'PHOTOSHOOT');
    const [hasSearched, setHasSearched] = useState(false);
    const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const handleFindMatches = async () => {
        setLoading(true);
        try {
             const userWithGoal = { ...user, activeGoal: { ...user.activeGoal, type: activeGoal } } as User;
             const results = await findStrategicMatches(userWithGoal, store.getUsers());
             setMatches(results);
             setHasSearched(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
             {/* Location Header */}
             <LocationHeader user={user} onUpgrade={() => setShowUpgradeAlert(true)} />

            {/* Control Panel */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100 relative">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-purple-900 text-lg">Strategic Matching</h2>
                            <p className="text-xs text-purple-800/70">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <button onClick={() => setShowHelp(true)} className="p-2 text-purple-300 hover:text-purple-600 transition-colors">
                        <Info className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <Select 
                        label="What is your current focus?" 
                        value={activeGoal} 
                        onChange={e => setActiveGoal(e.target.value as BusinessGoal)}
                        className="bg-white/80 backdrop-blur"
                    >
                         <option value="PHOTOSHOOT">Shared Photoshoot</option>
                         <option value="GIVEAWAY">Joint Giveaway</option>
                         <option value="POP_UP">Pop-Up Event</option>
                         <option value="CO_MARKETING">Cross-Promotion</option>
                    </Select>

                    <Button 
                        onClick={handleFindMatches} 
                        isLoading={loading} 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 py-3 text-base"
                    >
                        {loading ? 'Analyzing Network...' : 'Find My Partners'}
                    </Button>
                </div>
            </Card>

            {/* Results List */}
            <div className="space-y-4">
                {hasSearched && matches.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No perfect matches found in {user.homeCity} for this goal. 
                        {user.subscriptionScope === 'CITY' && (
                             <div className="mt-2 text-xs text-pink-600 font-bold cursor-pointer" onClick={() => setShowUpgradeAlert(true)}>
                                 Try searching Global?
                             </div>
                        )}
                    </div>
                )}

                {matches.map(match => {
                    const candidate = store.getUser(match.candidateId);
                    if (!candidate) return null;
                    
                    return (
                        <Card key={match.candidateId} className="p-5 hover:shadow-md transition-shadow group">
                            <div className="flex gap-4 mb-4">
                                <img src={candidate.avatarUrl} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt={candidate.name} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{candidate.name}</h3>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                                                <Building2 className="w-3.5 h-3.5" />
                                                <span>{candidate.businessType}</span>
                                                <span className="mx-1">•</span>
                                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{candidate.homeCity || 'Remote'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                                                {match.matchScore}%
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Match</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 p-3 rounded-lg mb-4 relative">
                                <div className="absolute top-0 left-4 -translate-y-1/2 w-3 h-3 bg-purple-50 rotate-45"></div>
                                <p className="text-sm text-purple-900 italic leading-relaxed">
                                    "{match.collaborationPitch}"
                                </p>
                            </div>

                            <Button variant="outline" className="w-full gap-2 group-hover:border-purple-300 group-hover:text-purple-700 transition-colors">
                                <Handshake className="w-4 h-4" />
                                Connect
                                <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </Card>
                    );
                })}
            </div>

            {/* Upgrade Modal (Simple Alert for now) */}
            <Modal isOpen={showUpgradeAlert} onClose={() => setShowUpgradeAlert(false)} title="Go Global 🌍">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                        <Globe className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Unlock Global Matching</h3>
                    <p className="text-gray-500 text-sm">
                        You are currently restricted to <strong>{user.homeCity}</strong>. Upgrade to Platinum to match with businesses in New York, London, and Tokyo.
                    </p>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowUpgradeAlert(false)}>
                        View Platinum Plan (€99/mo)
                    </Button>
                    <button onClick={() => setShowUpgradeAlert(false)} className="text-sm text-gray-400 font-medium">Maybe later</button>
                </div>
            </Modal>

            {/* Help Sheet */}
            <HelpSheet
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title="AI Matching Explained"
                heroIcon={Sparkles}
                steps={[
                    { title: "Set Your Goal", text: "Select what you want to achieve (e.g., Shared Photoshoot)." },
                    { title: "AI Analysis", text: "Gemini analyzes your brand vibe and finds complimentary partners." },
                    { title: "Connect & Split", text: "Start a chat, pool your budget, and execute the project together." }
                ]}
                proTip="Businesses with complete profiles get 3x more matches."
            />
        </div>
    );
};
