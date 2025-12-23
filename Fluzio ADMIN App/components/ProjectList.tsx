
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Project } from '../types';
import { Card, Button, Badge } from './Common';
import { PiggyBank, CheckCircle2, Circle, UserPlus } from 'lucide-react';
import { ZeroState } from './ZeroState';

interface ProjectListProps {
  projects: Project[];
  onCreateProject: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onCreateProject }) => {
  const { t } = useTranslation();
  if (projects.length === 0) {
      return (
        <ZeroState 
            icon={PiggyBank}
            title={t('business.splitCosts')}
            description={t('business.splitCostsDescription')}
            actionLabel={t('business.createFirstProject')}
            onAction={onCreateProject}
        />
      );
  }

  return (
    <div className="space-y-4">
      {projects.map(project => {
        const fundedAmount = project.slots.reduce((acc, slot) => slot.status === 'FUNDED' ? acc + slot.cost : acc, 0);
        const progress = Math.min(100, Math.round((fundedAmount / project.totalCost) * 100));
        const openSlots = project.slots.filter(s => s.status === 'OPEN').length;

        return (
          <Card key={project.id} className="overflow-hidden">
             {/* Header */}
             <div className="p-5 pb-3">
                 <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-lg text-gray-900">{project.title}</h3>
                     {openSlots > 0 ? (
                        <Badge text={`${openSlots} ${t('business.slotsOpen')}`} color="bg-green-100 text-green-700" />
                     ) : (
                        <Badge text={t('business.fullyFunded')} color="bg-gray-100 text-gray-600" />
                     )}
                 </div>
                 
                 {/* Funding Progress */}
                 <div className="mt-3">
                     <div className="flex justify-between text-xs font-semibold mb-1.5">
                         <span className="text-gray-500">{t('business.fundingProgress')}</span>
                         <span className="text-gray-900">€{fundedAmount} / €{project.totalCost}</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                         <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                         />
                     </div>
                 </div>
             </div>

             {/* Slots List */}
             <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                 {project.slots.map((slot, idx) => (
                     <div key={idx} className="p-3 px-5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             {slot.status === 'FUNDED' ? (
                                 <CheckCircle2 className="w-5 h-5 text-green-500" />
                             ) : (
                                 <Circle className="w-5 h-5 text-gray-300" />
                             )}
                             <div>
                                 <div className="text-sm font-medium text-gray-900">{slot.role}</div>
                                 <div className="text-xs text-gray-500">{t('business.cost')}: €{slot.cost}</div>
                             </div>
                         </div>
                         
                         {slot.status === 'OPEN' ? (
                             <Button size="sm" variant="outline" className="h-8 px-3 text-xs bg-white">
                                 <PiggyBank className="w-3.5 h-3.5 mr-1.5" />
                                 {t('business.fund')}
                             </Button>
                         ) : (
                             <span className="text-xs font-medium text-gray-400 italic">{t('business.funded')}</span>
                         )}
                     </div>
                 ))}
             </div>
             
             {/* Action Footer */}
             <div className="p-3 bg-white border-t border-gray-100 text-center">
                 <button className="text-sm text-blue-600 font-medium hover:underline flex items-center justify-center gap-1 w-full">
                     <UserPlus className="w-4 h-4" /> {t('business.inviteCollaborators')}
                 </button>
             </div>
          </Card>
        );
      })}
    </div>
  );
};
