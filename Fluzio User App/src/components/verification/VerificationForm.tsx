/**
 * Business Verification Component
 * Submit verification request for verified badge
 */

import React, { useState } from 'react';
import { 
  Award, 
  Upload, 
  FileText, 
  Building2, 
  MapPin, 
  Globe,
  CheckCircle,
  X,
  Loader,
  AlertCircle
} from 'lucide-react';

interface VerificationFormProps {
  userId: string;
  userLevel: number;
  userTier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
  onSuccess?: () => void;
}

const DOCUMENT_TYPES = {
  BUSINESS_REGISTRATION: { label: 'Business Registration', required: true },
  TAX_ID: { label: 'Tax ID / VAT Number', required: true },
  PROOF_OF_ADDRESS: { label: 'Proof of Business Address', required: true },
  FINANCIAL_STATEMENT: { label: 'Financial Statement', required: false },
  PORTFOLIO: { label: 'Portfolio / Case Studies', required: false },
  CLIENT_TESTIMONIAL: { label: 'Client Testimonials', required: false },
  MEDIA_COVERAGE: { label: 'Media Coverage / Awards', required: false },
  PROFESSIONAL_REFERENCE: { label: 'Professional References', required: false }
};

export const VerificationForm: React.FC<VerificationFormProps> = ({
  userId,
  userLevel,
  userTier,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessType, setBusinessType] = useState('LLC');
  const [industry, setIndustry] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [website, setWebsite] = useState('');
  
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });
  
  const [documents, setDocuments] = useState<any[]>([]);

  // Check eligibility
  const isEligible = userLevel >= 5 && (userTier === 'GOLD' || userTier === 'PLATINUM') ||
                     userLevel === 6 && (userTier === 'SILVER' || userTier === 'GOLD' || userTier === 'PLATINUM');

  const handleFileUpload = (type: string, file: File) => {
    // In production, upload to Cloud Storage
    // For now, just store file reference
    const fileUrl = `gs://fluzio-documents/${userId}/${type}/${file.name}`;
    
    setDocuments(prev => [
      ...prev.filter(doc => doc.type !== type),
      {
        type,
        fileName: file.name,
        fileUrl,
        uploadedAt: new Date()
      }
    ]);
  };

  const handleSubmit = async () => {
    if (!businessName || !taxId || documents.length < 3) {
      alert('Please complete all required fields and upload documents');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        'https://us-central1-fluzio-13af2.cloudfunctions.net/submitVerificationRequest',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            businessName,
            registrationNumber,
            taxId,
            address,
            businessType,
            industry,
            yearsInBusiness: parseInt(yearsInBusiness) || 0,
            website,
            documents
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\n\nEstimated review time: ${data.estimatedReviewTime}`);
        if (onSuccess) onSuccess();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isEligible) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-orange-900 mb-2">Not Eligible</h3>
          <p className="text-orange-800">
            Verified badge is available for:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-orange-700">
            <li>• Level 5+ Gold or Platinum tier</li>
            <li>• Level 6 Silver, Gold, or Platinum tier</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#1E0E62] mb-2">Get Verified</h1>
        <p className="text-[#8F8FA3]">
          Complete your business verification to unlock the verified badge
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step === 1 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className="font-semibold">1. Business Info</span>
        </div>
        <div className="w-8 h-0.5 bg-gray-200" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step === 2 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className="font-semibold">2. Documents</span>
        </div>
        <div className="w-8 h-0.5 bg-gray-200" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step === 3 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className="font-semibold">3. Review</span>
        </div>
      </div>

      {/* Step 1: Business Information */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Business Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="Your Company LLC"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tax ID / VAT Number *
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="SOLE_PROPRIETOR">Sole Proprietor</option>
                  <option value="LLC">LLC</option>
                  <option value="CORPORATION">Corporation</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="NON_PROFIT">Non-Profit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="Technology, Consulting, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years in Business
                </label>
                <input
                  type="number"
                  value={yearsInBusiness}
                  onChange={(e) => setYearsInBusiness(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Business Address *
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="Street Address"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="State/Province"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="Country"
                  />
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    placeholder="Postal Code"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep(2)}
              disabled={!businessName || !taxId || !address.city}
              className="px-8 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Upload Documents
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Documents */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Upload Documents
          </h2>

          <div className="space-y-4 mb-8">
            {Object.entries(DOCUMENT_TYPES).map(([type, info]) => {
              const uploaded = documents.find(doc => doc.type === type);
              
              return (
                <div key={type} className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {info.label}
                        {info.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                    </div>
                    {uploaded && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {uploaded ? uploaded.fileName : 'Choose file...'}
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(type, file);
                        }}
                      />
                    </label>
                    
                    {uploaded && (
                      <button
                        onClick={() => setDocuments(prev => prev.filter(doc => doc.type !== type))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-purple-500"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={documents.length < 3}
              className="px-8 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review & Submit
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-6">Review Your Application</h2>

          <div className="space-y-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Business Information</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="font-semibold">Name:</span> {businessName}</p>
                <p><span className="font-semibold">Tax ID:</span> {taxId}</p>
                <p><span className="font-semibold">Type:</span> {businessType}</p>
                <p><span className="font-semibold">Address:</span> {address.street}, {address.city}, {address.country}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Documents ({documents.length})</h3>
              <div className="space-y-2">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{DOCUMENT_TYPES[doc.type as keyof typeof DOCUMENT_TYPES]?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900">
              ℹ️ Your application will be reviewed by our team within 3-7 business days. 
              You'll receive an email notification once the review is complete.
            </p>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-8 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-purple-500"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  Submit for Verification
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationForm;
