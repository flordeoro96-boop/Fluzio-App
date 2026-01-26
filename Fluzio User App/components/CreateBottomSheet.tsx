import React from 'react';
import { Camera, Users, Calendar, Sparkles } from 'lucide-react';
import { ContentType, UserRole } from '../types';
import './CreateBottomSheet.css';

interface CreateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: ContentType) => void;
  userRole: UserRole;
}

interface ContentTypeOption {
  type: ContentType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  allowedRoles: UserRole[];
}

const contentTypeOptions: ContentTypeOption[] = [
  {
    type: ContentType.EXPERIENCE_POST,
    icon: <Sparkles size={24} />,
    label: 'Experience',
    description: 'Share or host something real',
    color: '#6C4BFF',
    allowedRoles: [UserRole.MEMBER, UserRole.CREATOR, UserRole.BUSINESS]
  },
  {
    type: ContentType.MOMENT,
    icon: <Camera size={24} />,
    label: 'Moment',
    description: 'Share a quick visual moment',
    color: '#A855F7',
    allowedRoles: [UserRole.MEMBER, UserRole.CREATOR]
  },
  {
    type: ContentType.COLLABORATION_CALL,
    icon: <Users size={24} />,
    label: 'Collaboration',
    description: 'Invite others to create together',
    color: '#EC4899',
    allowedRoles: [UserRole.CREATOR, UserRole.BUSINESS]
  },
  {
    type: ContentType.EVENT_PREVIEW,
    icon: <Calendar size={24} />,
    label: 'Event',
    description: 'Organize a public or private event',
    color: '#10B981',
    allowedRoles: [UserRole.BUSINESS]
  }
];

export const CreateBottomSheet: React.FC<CreateBottomSheetProps> = ({
  isOpen,
  onClose,
  onSelectType,
  userRole
}) => {
  if (!isOpen) return null;

  const availableOptions = contentTypeOptions.filter(option =>
    option.allowedRoles.includes(userRole)
  );

  const handleSelectType = (type: ContentType) => {
    onSelectType(type);
    onClose();
  };

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        
        <div className="bottom-sheet-header">
          <h3>What would you like to create?</h3>
        </div>

        <div className="bottom-sheet-content">
          {availableOptions.map((option) => (
            <button
              key={option.type}
              className="content-type-card"
              onClick={() => handleSelectType(option.type)}
              style={{ '--card-color': option.color } as React.CSSProperties}
            >
              <div className="content-type-icon" style={{ color: option.color }}>
                {option.icon}
              </div>
              <div className="content-type-info">
                <div className="content-type-label">{option.label}</div>
                <div className="content-type-description">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
