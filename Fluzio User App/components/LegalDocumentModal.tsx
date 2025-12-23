import React from 'react';
import { X, FileText } from 'lucide-react';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'terms' | 'privacy' | 'licenses';
}

const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({ isOpen, onClose, documentType }) => {
  const getContent = () => {
    switch (documentType) {
      case 'terms':
        return {
          title: 'Terms of Service',
          lastUpdated: 'November 30, 2025',
          sections: [
            {
              heading: '1. Acceptance of Terms',
              content: 'By accessing and using Fluzio ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.'
            },
            {
              heading: '2. Description of Service',
              content: 'Fluzio is a platform that connects users with local businesses through missions, rewards, and community events. The Service allows users to discover businesses, complete missions, earn rewards, and participate in meetups.'
            },
            {
              heading: '3. User Accounts',
              content: 'You must create an account to use certain features of the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.'
            },
            {
              heading: '4. User Conduct',
              content: 'You agree not to use the Service to: (a) upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable; (b) impersonate any person or entity; (c) forge headers or manipulate identifiers; (d) upload, post, or transmit any unsolicited advertising, promotional materials, or spam; (e) interfere with or disrupt the Service or servers or networks connected to the Service.'
            },
            {
              heading: '5. Mission Completion & Rewards',
              content: 'Missions must be completed according to the requirements specified by the business. Rewards are earned upon successful mission completion and verification. Fluzio reserves the right to withhold rewards if fraud or Terms violations are detected. Points and rewards have no cash value and cannot be transferred or sold.'
            },
            {
              heading: '6. Intellectual Property',
              content: 'The Service and its original content, features, and functionality are owned by Fluzio and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not modify, reproduce, distribute, create derivative works of, publicly display, or exploit the Service without our prior written consent.'
            },
            {
              heading: '7. User-Generated Content',
              content: 'You retain ownership of content you submit to the Service. By submitting content, you grant Fluzio a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and distribute such content in connection with the Service.'
            },
            {
              heading: '8. Privacy',
              content: 'Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.'
            },
            {
              heading: '9. Termination',
              content: 'We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.'
            },
            {
              heading: '10. Limitation of Liability',
              content: 'To the maximum extent permitted by law, Fluzio shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.'
            },
            {
              heading: '11. Changes to Terms',
              content: 'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. Continued use of the Service after changes constitutes acceptance of the new Terms.'
            },
            {
              heading: '12. Contact Information',
              content: 'If you have any questions about these Terms, please contact us at legal@fluzio.com'
            }
          ]
        };

      case 'privacy':
        return {
          title: 'Privacy Policy',
          lastUpdated: 'November 30, 2025',
          sections: [
            {
              heading: '1. Information We Collect',
              content: 'We collect information you provide directly (name, email, profile details), information collected automatically (device information, usage data, location data), and information from third parties (social media accounts, business partners).'
            },
            {
              heading: '2. How We Use Your Information',
              content: 'We use your information to: provide and improve the Service; personalize your experience; communicate with you; process transactions and send notifications; detect and prevent fraud; comply with legal obligations.'
            },
            {
              heading: '3. Location Information',
              content: 'We collect precise location data when you use location-based features. You can disable location services in your device settings, but some features may not function properly. Location data is used to show nearby businesses, missions, and events.'
            },
            {
              heading: '4. Sharing of Information',
              content: 'We may share your information with: businesses you interact with; service providers who assist us; other users (profile information, activity); legal authorities when required by law; business partners with your consent.'
            },
            {
              heading: '5. Data Security',
              content: 'We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. We use encryption, secure servers, and regular security audits.'
            },
            {
              heading: '6. Your Rights',
              content: 'You have the right to: access your personal data; correct inaccurate data; delete your data; restrict processing; data portability; object to processing; withdraw consent. Contact us to exercise these rights.'
            },
            {
              heading: '7. Cookies and Tracking',
              content: 'We use cookies and similar tracking technologies to track activity and hold certain information. You can instruct your browser to refuse cookies, but some features may not function properly.'
            },
            {
              heading: '8. Third-Party Services',
              content: 'The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. Please review their privacy policies.'
            },
            {
              heading: '9. Children\'s Privacy',
              content: 'The Service is not intended for children under 13 (or 16 in the EU). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us.'
            },
            {
              heading: '10. Data Retention',
              content: 'We retain your personal information for as long as necessary to provide the Service and fulfill the purposes described in this Privacy Policy. You can request deletion of your account and data at any time.'
            },
            {
              heading: '11. International Data Transfers',
              content: 'Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.'
            },
            {
              heading: '12. Changes to Privacy Policy',
              content: 'We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service. Continued use after changes constitutes acceptance.'
            },
            {
              heading: '13. Contact Us',
              content: 'For privacy-related questions or to exercise your rights, contact us at privacy@fluzio.com'
            }
          ]
        };

      case 'licenses':
        return {
          title: 'Open Source Licenses',
          lastUpdated: 'November 30, 2025',
          sections: [
            {
              heading: 'React',
              content: 'MIT License - Copyright (c) Meta Platforms, Inc. and affiliates. Permission is hereby granted, free of charge, to any person obtaining a copy of this software...'
            },
            {
              heading: 'Firebase',
              content: 'Apache License 2.0 - Copyright 2023 Google LLC. Licensed under the Apache License, Version 2.0...'
            },
            {
              heading: 'Lucide Icons',
              content: 'ISC License - Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather...'
            },
            {
              heading: 'i18next',
              content: 'MIT License - Copyright (c) 2023 i18next. Permission is hereby granted, free of charge...'
            },
            {
              heading: 'React Router',
              content: 'MIT License - Copyright (c) React Training LLC 2015-2019...'
            },
            {
              heading: 'Vite',
              content: 'MIT License - Copyright (c) 2019-present Evan You. Permission is hereby granted...'
            },
            {
              heading: 'TypeScript',
              content: 'Apache License 2.0 - Copyright Microsoft Corporation. All rights reserved...'
            },
            {
              heading: 'Tailwind CSS',
              content: 'MIT License - Copyright (c) Tailwind Labs, Inc. Permission is hereby granted...'
            },
            {
              heading: 'date-fns',
              content: 'MIT License - Copyright (c) 2021 Sasha Koss. Permission is hereby granted, free of charge...'
            },
            {
              heading: 'OpenAI',
              content: 'MIT License - Copyright (c) OpenAI. Permission is hereby granted, free of charge...'
            }
          ]
        };

      default:
        return { title: '', lastUpdated: '', sections: [] };
    }
  };

  const { title, lastUpdated, sections } = getContent();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm text-white/80 mt-1">Last Updated: {lastUpdated}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="prose max-w-none">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{section.heading}</h3>
              <p className="text-gray-700 leading-relaxed">{section.content}</p>
            </div>
          ))}

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-600 text-center">
              By using Fluzio, you agree to these terms. For questions, contact us at{' '}
              <a href="mailto:legal@fluzio.com" className="text-purple-600 hover:text-purple-700 font-medium">
                legal@fluzio.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentModal;
