
import React, { useState, useEffect } from 'react';
import { OnboardingState, BusinessCategory } from '../types';
import { Button, Input, Select, Modal, Card } from './Common';
import { Store, Sparkles, ArrowRight, ArrowLeft, Check, Smartphone, Rocket, MapPin, Search, Mail, ShoppingBag, Globe, DownloadCloud, X, Briefcase, Dumbbell, Coffee, CheckCircle2, Building2, FileText, ShieldCheck, Upload, Info, Phone, FileCheck, Lock, User as UserIcon, Shield } from 'lucide-react';
import { api } from '../services/AuthContext';
import { useAuth } from '../services/AuthContext';
import { getCurrentLocation } from '../services/locationService';
import { useTranslation } from 'react-i18next';
import { CustomerInterestsScreen } from './CustomerInterestsScreen';
import { BusinessGoalsScreen } from './BusinessGoalsScreen';
import { BusinessMaturityAssessment } from './BusinessMaturityAssessment';
import { LevelRevealScreen } from './LevelRevealScreen';
import { socialAuthService } from '../services/socialAuthService';
import { AddressAutocomplete } from './AddressAutocomplete';

interface SignUpScreenProps {
  onComplete: (data: OnboardingState) => void;
  onBack: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onComplete, onBack }) => {
  const { signInWithGoogle, signInWithApple, signUpWithEmail, user } = useAuth();
    const { t } = useTranslation();
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [formData, setFormData] = useState<OnboardingState>({
    step: 0,
    role: null,
    authMethod: undefined,
    isAspiringBusiness: false,
    locationPermissionGranted: false,
    email: '',
    password: '',
    gender: undefined,
    preferFemaleOnly: false,
    handle: '',
    city: '',
    category: 'GASTRONOMY',
    businessMode: 'PHYSICAL',
    website: '',
    referralCode: '',
    vibes: [],
    // New Fields
    legalName: '',
    vatId: '',
    registrationNumber: '',
    street: '',
    zipCode: '',
    phone: '',
    documents: [],
    isAuthorized: false,
    verifiedSources: { google: false, shopify: false },
    subCategory: '',
    // Contact Person
    firstName: '',
    lastName: '',
    position: ''
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [showWhyVerify, setShowWhyVerify] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: false
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+49');
  const [operatingCountry, setOperatingCountry] = useState('DE'); // ISO country code where business operates
  const [showInterestsScreen, setShowInterestsScreen] = useState(false);
  const [showGoalsScreen, setShowGoalsScreen] = useState(false);
  const [showMaturityAssessment, setShowMaturityAssessment] = useState(false);
  const [showLevelReveal, setShowLevelReveal] = useState(false);

  // Common country codes
  const COUNTRY_CODES = [
    { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
    { code: '+355', country: 'Albania', flag: '🇦🇱' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+1-684', country: 'American Samoa', flag: '🇦🇸' },
    { code: '+376', country: 'Andorra', flag: '🇦🇩' },
    { code: '+244', country: 'Angola', flag: '🇦🇴' },
    { code: '+1-264', country: 'Anguilla', flag: '🇦🇮' },
    { code: '+672', country: 'Antarctica', flag: '🇦🇶' },
    { code: '+1-268', country: 'Antigua and Barbuda', flag: '🇦🇬' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+374', country: 'Armenia', flag: '🇦🇲' },
    { code: '+297', country: 'Aruba', flag: '🇦🇼' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
    { code: '+1-242', country: 'Bahamas', flag: '🇧🇸' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+1-246', country: 'Barbados', flag: '🇧🇧' },
    { code: '+375', country: 'Belarus', flag: '🇧🇾' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+501', country: 'Belize', flag: '🇧🇿' },
    { code: '+229', country: 'Benin', flag: '🇧🇯' },
    { code: '+1-441', country: 'Bermuda', flag: '🇧🇲' },
    { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
    { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
    { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
    { code: '+267', country: 'Botswana', flag: '🇧🇼' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+246', country: 'British Indian Ocean Territory', flag: '🇮🇴' },
    { code: '+1-284', country: 'British Virgin Islands', flag: '🇻🇬' },
    { code: '+673', country: 'Brunei', flag: '🇧🇳' },
    { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
    { code: '+1-345', country: 'Cayman Islands', flag: '🇰🇾' },
    { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
    { code: '+235', country: 'Chad', flag: '🇹🇩' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+61', country: 'Christmas Island', flag: '🇨🇽' },
    { code: '+61', country: 'Cocos Islands', flag: '🇨🇨' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+269', country: 'Comoros', flag: '🇰🇲' },
    { code: '+682', country: 'Cook Islands', flag: '🇨🇰' },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
    { code: '+385', country: 'Croatia', flag: '🇭🇷' },
    { code: '+53', country: 'Cuba', flag: '🇨🇺' },
    { code: '+599', country: 'Curacao', flag: '🇨🇼' },
    { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
    { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
    { code: '+243', country: 'Democratic Republic of the Congo', flag: '🇨🇩' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
    { code: '+1-767', country: 'Dominica', flag: '🇩🇲' },
    { code: '+1-809', country: 'Dominican Republic', flag: '🇩🇴' },
    { code: '+670', country: 'East Timor', flag: '🇹🇱' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
    { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
    { code: '+372', country: 'Estonia', flag: '🇪🇪' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+500', country: 'Falkland Islands', flag: '🇫🇰' },
    { code: '+298', country: 'Faroe Islands', flag: '🇫🇴' },
    { code: '+679', country: 'Fiji', flag: '🇫🇯' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+689', country: 'French Polynesia', flag: '🇵🇫' },
    { code: '+241', country: 'Gabon', flag: '🇬🇦' },
    { code: '+220', country: 'Gambia', flag: '🇬🇲' },
    { code: '+995', country: 'Georgia', flag: '🇬🇪' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+350', country: 'Gibraltar', flag: '🇬🇮' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+299', country: 'Greenland', flag: '🇬🇱' },
    { code: '+1-473', country: 'Grenada', flag: '🇬🇩' },
    { code: '+1-671', country: 'Guam', flag: '🇬🇺' },
    { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
    { code: '+44-1481', country: 'Guernsey', flag: '🇬🇬' },
    { code: '+224', country: 'Guinea', flag: '🇬🇳' },
    { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: '+592', country: 'Guyana', flag: '🇬🇾' },
    { code: '+509', country: 'Haiti', flag: '🇭🇹' },
    { code: '+504', country: 'Honduras', flag: '🇭🇳' },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+36', country: 'Hungary', flag: '🇭🇺' },
    { code: '+354', country: 'Iceland', flag: '🇮🇸' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+98', country: 'Iran', flag: '🇮🇷' },
    { code: '+964', country: 'Iraq', flag: '🇮🇶' },
    { code: '+353', country: 'Ireland', flag: '🇮🇪' },
    { code: '+44-1624', country: 'Isle of Man', flag: '🇮🇲' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
    { code: '+1-876', country: 'Jamaica', flag: '🇯🇲' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+44-1534', country: 'Jersey', flag: '🇯🇪' },
    { code: '+962', country: 'Jordan', flag: '🇯🇴' },
    { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
    { code: '+383', country: 'Kosovo', flag: '🇽🇰' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: '+856', country: 'Laos', flag: '🇱🇦' },
    { code: '+371', country: 'Latvia', flag: '🇱🇻' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
    { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
    { code: '+231', country: 'Liberia', flag: '🇱🇷' },
    { code: '+218', country: 'Libya', flag: '🇱🇾' },
    { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
    { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
    { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
    { code: '+853', country: 'Macau', flag: '🇲🇴' },
    { code: '+389', country: 'Macedonia', flag: '🇲🇰' },
    { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
    { code: '+265', country: 'Malawi', flag: '🇲🇼' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+960', country: 'Maldives', flag: '🇲🇻' },
    { code: '+223', country: 'Mali', flag: '🇲🇱' },
    { code: '+356', country: 'Malta', flag: '🇲🇹' },
    { code: '+692', country: 'Marshall Islands', flag: '🇲🇭' },
    { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
    { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
    { code: '+262', country: 'Mayotte', flag: '🇾🇹' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+691', country: 'Micronesia', flag: '🇫🇲' },
    { code: '+373', country: 'Moldova', flag: '🇲🇩' },
    { code: '+377', country: 'Monaco', flag: '🇲🇨' },
    { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
    { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
    { code: '+1-664', country: 'Montserrat', flag: '🇲🇸' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
    { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
    { code: '+264', country: 'Namibia', flag: '🇳🇦' },
    { code: '+674', country: 'Nauru', flag: '🇳🇷' },
    { code: '+977', country: 'Nepal', flag: '🇳🇵' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+687', country: 'New Caledonia', flag: '🇳🇨' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
    { code: '+227', country: 'Niger', flag: '🇳🇪' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+683', country: 'Niue', flag: '🇳🇺' },
    { code: '+850', country: 'North Korea', flag: '🇰🇵' },
    { code: '+1-670', country: 'Northern Mariana Islands', flag: '🇲🇵' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+680', country: 'Palau', flag: '🇵🇼' },
    { code: '+970', country: 'Palestine', flag: '🇵🇸' },
    { code: '+507', country: 'Panama', flag: '🇵🇦' },
    { code: '+675', country: 'Papua New Guinea', flag: '🇵🇬' },
    { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+64', country: 'Pitcairn', flag: '🇵🇳' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+1-787', country: 'Puerto Rico', flag: '🇵🇷' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+242', country: 'Republic of the Congo', flag: '🇨🇬' },
    { code: '+262', country: 'Reunion', flag: '🇷🇪' },
    { code: '+40', country: 'Romania', flag: '🇷🇴' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+590', country: 'Saint Barthelemy', flag: '🇧🇱' },
    { code: '+290', country: 'Saint Helena', flag: '🇸🇭' },
    { code: '+1-869', country: 'Saint Kitts and Nevis', flag: '🇰🇳' },
    { code: '+1-758', country: 'Saint Lucia', flag: '🇱🇨' },
    { code: '+590', country: 'Saint Martin', flag: '🇲🇫' },
    { code: '+508', country: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
    { code: '+1-784', country: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
    { code: '+685', country: 'Samoa', flag: '🇼🇸' },
    { code: '+378', country: 'San Marino', flag: '🇸🇲' },
    { code: '+239', country: 'Sao Tome and Principe', flag: '🇸🇹' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+221', country: 'Senegal', flag: '🇸🇳' },
    { code: '+381', country: 'Serbia', flag: '🇷🇸' },
    { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
    { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+1-721', country: 'Sint Maarten', flag: '🇸🇽' },
    { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
    { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
    { code: '+677', country: 'Solomon Islands', flag: '🇸🇧' },
    { code: '+252', country: 'Somalia', flag: '🇸🇴' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+211', country: 'South Sudan', flag: '🇸🇸' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+249', country: 'Sudan', flag: '🇸🇩' },
    { code: '+597', country: 'Suriname', flag: '🇸🇷' },
    { code: '+47', country: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
    { code: '+268', country: 'Swaziland', flag: '🇸🇿' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+963', country: 'Syria', flag: '🇸🇾' },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
    { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+228', country: 'Togo', flag: '🇹🇬' },
    { code: '+690', country: 'Tokelau', flag: '🇹🇰' },
    { code: '+676', country: 'Tonga', flag: '🇹🇴' },
    { code: '+1-868', country: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
    { code: '+1-649', country: 'Turks and Caicos Islands', flag: '🇹🇨' },
    { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
    { code: '+1-340', country: 'U.S. Virgin Islands', flag: '🇻🇮' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
    { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
    { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
    { code: '+379', country: 'Vatican', flag: '🇻🇦' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+681', country: 'Wallis and Futuna', flag: '🇼🇫' },
    { code: '+212', country: 'Western Sahara', flag: '🇪🇭' },
    { code: '+967', country: 'Yemen', flag: '🇾🇪' },
    { code: '+260', country: 'Zambia', flag: '🇿🇲' },
    { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  ];

  // Check for referral code in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      updateField('referralCode', refCode.toUpperCase());
      console.log('[SignUp] Referral code from URL:', refCode);
    }
  }, []);

  // Pre-fill Google data when reaching step 3
  useEffect(() => {
    if (formData.step === 3 && formData.authMethod === 'GOOGLE') {
      const currentUser = authenticatedUser || user;
      if (currentUser) {
        // Only update if fields are still empty (don't overwrite user edits)
        if (!formData.legalName && currentUser.displayName) {
          updateField('legalName', currentUser.displayName);
        }
        if (!formData.handle && currentUser.displayName) {
          updateField('handle', currentUser.displayName);
        }
        if (!formData.phone && currentUser.phoneNumber) {
          const phone = currentUser.phoneNumber.replace(/^\+49/, '').trim();
          updateField('phone', phone);
        }
      }
    }
  }, [formData.step, formData.authMethod]);

  const updateField = (field: keyof OnboardingState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const updateVerifiedSource = (source: 'google' | 'shopify', value: boolean) => {
    setFormData(prev => ({ ...prev, verifiedSources: { ...prev.verifiedSources, [source]: value } }));
  }

  const nextStep = () => updateField('step', formData.step + 1);
  const prevStep = () => updateField('step', formData.step - 1);

  const handleLocationRequest = async () => {
      setIsLoadingLocation(true);
      
      try {
          const location = await getCurrentLocation();
          
          if (location) {
              updateField('locationPermissionGranted', true);
              updateField('city', location.city);
              console.log('[SignUp] Location obtained:', location.city, location);
          } else {
              alert(t('signup.location.enableLocationPermissions'));
          }
      } catch (error) {
          console.warn("Location error:", error);
          alert(t('signup.location.unableToGetLocation'));
      } finally {
          setIsLoadingLocation(false);
      }
  };

  const createInitialUserProfile = async (role: string, isAspiring: boolean) => {
      try {
          const currentUser = authenticatedUser || user;
          console.log('Auth user state:', currentUser);
          console.log('Form data email:', formData.email);
          console.log('Role:', role);
          
          if (!currentUser) {
              throw new Error('User not authenticated');
          }

          const initialUserData = {
              uid: currentUser.uid,
              email: currentUser.email || formData.email,
              role: role,
              isAspiringBusiness: isAspiring,
              authMethod: formData.authMethod,
              createdAt: new Date().toISOString(),
              profileComplete: false
          };

          console.log('Creating initial user profile with role:', initialUserData);
          console.log('UID:', initialUserData.uid, 'Email:', initialUserData.email, 'Role:', initialUserData.role);
          
          const result = await api.createUser(initialUserData as any);

          if (!result.success) {
              throw new Error(result.error || 'Failed to create user profile');
          }

          return true;
      } catch (error) {
          console.error('Failed to create initial profile:', error);
          alert('Failed to create profile. Please try again.');
          return false;
      }
  };

  const toggleVibe = (tag: string) => {
    const current = formData.vibes;
    if (current.includes(tag)) {
        updateField('vibes', current.filter(t => t !== tag));
    } else {
        updateField('vibes', [...current, tag]);
    }
  };

  const handleGoogleLogin = async () => {
      try {
          const userCredential = await signInWithGoogle();
          const firebaseUser = userCredential.user;
          
          // Store user for later
          setAuthenticatedUser(firebaseUser);
          
          // Pre-fill form data from Google account
          if (firebaseUser.email) {
              updateField('email', firebaseUser.email);
          }
          if (firebaseUser.displayName) {
              updateField('legalName', firebaseUser.displayName);
              updateField('handle', firebaseUser.displayName);
          }
          if ((firebaseUser as any).phone || (firebaseUser as any).phoneNumber) {
              // Remove country code prefix if present
              const phone = ((firebaseUser as any).phoneNumber || (firebaseUser as any).phone || '').replace(/^\+49/, '').trim();
              if (phone) updateField('phone', phone);
          }
          
          updateField('authMethod', 'GOOGLE');
          nextStep();
      } catch (error) {
          console.error('Google sign-in error:', error);
          alert(t('signup.googleSignInFailed'));
      }
  };

  const handleAppleLogin = async () => {
      try {
          const userCredential = await signInWithApple();
          const firebaseUser = userCredential.user;
          
          // Store user for later
          setAuthenticatedUser(firebaseUser);
          
          // Pre-fill form data from Apple account
          if (firebaseUser.email) {
              updateField('email', firebaseUser.email);
          }
          if (firebaseUser.displayName) {
              updateField('legalName', firebaseUser.displayName);
              updateField('handle', firebaseUser.displayName);
          }
          
          updateField('authMethod', 'APPLE');
          nextStep();
      } catch (error) {
          console.error('Apple sign-in error:', error);
          alert(t('signup.appleSignInFailed'));
      }
  };

  const handleEmailSignup = async () => {
      if (!formData.email || !formData.password) {
          alert(t('signup.enterEmailPassword'));
          return;
      }
      
      // Just validate and move to next step - don't create account yet
      updateField('authMethod', 'EMAIL');
      nextStep();
  };

  const handleSubmit = async () => {
  // Prevent double submission if already showing post-signup screens
  if (showMaturityAssessment || showLevelReveal || showGoalsScreen || showInterestsScreen) {
    console.log('[SignUp] Prevented duplicate submit - already in post-signup flow');
    return;
  }

  setIsSubmitting(true);
  setSubmitError(null);

  console.log('[SignUp] handleSubmit called, formData.role:', formData.role);

  try {
    // 1) AUTH (Google or Email)
    let firebaseUser;

        if (formData.authMethod === "GOOGLE") {
      if (!user) {
                throw new Error(t('signup.googleAuthFailed'));
      }
      firebaseUser = user;
    } else {
      if (!formData.email || !formData.password) {
                throw new Error(t('signup.emailPasswordRequired'));
      }

      console.log("Creating Firebase auth account...");
      const userCredential = await signUpWithEmail(formData.email, formData.password);
      firebaseUser = userCredential.user;
      console.log("Supabase user created:", firebaseUser.uid);
    }

    // 2) ENSURE FIRESTORE USER DOC EXISTS (createuser)
    const initialUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || formData.email,
      role: formData.role,                   // from Step 1
      accountType: formData.accountType,     // business or creator (IMMUTABLE)
      authMethod: formData.authMethod,
      isAspiringBusiness: formData.isAspiringBusiness,
      step: formData.step,
      // Set approval status to PENDING for businesses
      approvalStatus: formData.role === 'BUSINESS' ? 'PENDING' : undefined,
    };

    console.log("Creating/ensuring initial Firestore user:", initialUserData);
    const createResult = await api.createUser(initialUserData as any, firebaseUser.uid);
        if (!createResult.success) {
            throw new Error(createResult.error || t('signup.createProfileFailed'));
    }

    // 3) UPDATE FULL PROFILE (updateuser)
    const completeUserData = {
      ...formData,
      uid: firebaseUser.uid,
      email: firebaseUser.email || formData.email,
      // Map legalName/handle to 'name' field for Firestore
      name: formData.legalName || formData.handle || formData.email.split('@')[0],
      accountType: formData.accountType,     // business or creator (IMMUTABLE)
      countryCode: countryCode, // Phone country code (+49, +961, etc.)
      operatingCountry: operatingCountry, // ISO country code where business/user operates (DE, LB, CH, etc.)
      profileComplete: formData.step === 4,   // optional: true only on final step
      updatedAt: new Date().toISOString(),
      // Map vibes to proper fields for personalization
      vibeTags: formData.vibes || [],  // Store as vibeTags for display
      vibe: formData.vibes || [],       // Store as vibe for legacy support
      interests: formData.role === 'CREATOR' || formData.role === 'MEMBER' ? formData.vibes : undefined,  // For creators/customers, map to interests used by mission matching
      businessGoals: formData.role === 'BUSINESS' ? formData.vibes : undefined,  // For businesses, map to goals
      // Set approval status for businesses
      approvalStatus: formData.role === 'BUSINESS' ? 'PENDING' : undefined,
    };

    console.log("Updating user profile:", completeUserData);

    const result = await api.updateUser(firebaseUser.uid, completeUserData as any);

    if (result.success) {
      console.log("User profile updated successfully!");
      
      // Process referral code if provided
      if (formData.referralCode) {
        try {
          const { processReferral } = await import('../services/referralService');
          const referralProcessed = await processReferral(firebaseUser.uid, formData.referralCode);
          if (referralProcessed) {
            console.log('[SignUp] Referral processed successfully');
          } else {
            console.log('[SignUp] Invalid referral code or self-referral');
          }
        } catch (error) {
          console.error('[SignUp] Error processing referral:', error);
        }
      }
      
      // Show interests/goals/maturity screen based on role
      if (formData.role === 'CREATOR' || formData.role === 'MEMBER') {
        console.log('[SignUp] Showing interests screen for CREATOR/MEMBER');
        setShowInterestsScreen(true);
      } else if (formData.role === 'BUSINESS') {
        // Show maturity assessment for businesses
        console.log('[SignUp] Showing maturity assessment for BUSINESS');
        setShowMaturityAssessment(true);
      } else {
        console.log('[SignUp] Completing signup for role:', formData.role);
        onComplete(formData);
      }
    } else {
      setSubmitError(result.error || t('signup.updateAccountFailed'));
    }
  } catch (error) {
    console.error("Signup error:", error);
        setSubmitError(t('errors.genericError'));
  } finally {
    setIsSubmitting(false);
  }
};

  const handleInterestsComplete = async (interests: string[]) => {
    // Save interests to user profile
    try {
      if (user?.uid) {
        await api.updateUser(user.uid, { interests });
      }
    } catch (error) {
      console.error('Error saving interests:', error);
    }
    onComplete(formData);
  };

  const handleSkipPreferences = () => {
    // Skip preferences and complete signup
    onComplete(formData);
  };

  const handleMaturityAssessmentComplete = () => {
    console.log('[SignUp] Maturity assessment complete, formData.calculatedLevel:', formData.calculatedLevel);
    // Hide maturity assessment and show level reveal screen
    setShowMaturityAssessment(false);
    setShowLevelReveal(true);
  };

  const handleLevelRevealContinue = async () => {
    // Save calculated level and maturity data to user profile
    try {
      if (user?.uid) {
        await api.updateUser(user.uid, {
          subscriptionLevel: formData.calculatedLevel,
          businessStage: formData.businessStage,
          businessAge: formData.businessAge,
          customerBase: formData.customerBase,
          monthlyRevenue: formData.monthlyRevenue,
          teamSize: formData.teamSize,
          onlinePresence: formData.onlinePresence,
          mainGoal: formData.mainGoal,
          growthSpeed: formData.growthSpeed,
          willingToCollaborate: formData.willingToCollaborate
        });
      }
    } catch (error) {
      console.error('Error saving maturity assessment:', error);
    }
    // Complete signup - go directly to pending approval
    onComplete(formData);
  };

  const simulateVerification = (source: 'google' | 'shopify') => {
      setIsImporting(true);
      setTimeout(() => {
          updateVerifiedSource(source, true);
          // Mock Data Fill if not already present
          if (source === 'google' && !formData.legalName) {
              setFormData(prev => ({
                  ...prev,
                  legalName: 'Bean & Brew GmbH',
                  handle: 'Bean & Brew GmbH',
                  street: 'Torstraße 101',
                  zipCode: '10119',
                  city: prev.city || 'Berlin',
                  verifiedSources: { ...prev.verifiedSources, google: true }
              }));
          }
           if (source === 'shopify' && !formData.website) {
              setFormData(prev => ({
                  ...prev,
                  website: 'www.beanandbrew.com',
                  verifiedSources: { ...prev.verifiedSources, shopify: true }
              }));
          }
          setIsImporting(false);
      }, 1500);
  };

  const handleConnectGoogle = async () => {
      setIsGoogleConnecting(true);
      try {
          const result = await socialAuthService.linkGoogle();
          if (result.success) {
              setConnectedAccounts(prev => ({ ...prev, google: true }));
              alert('Google account connected successfully!');
          } else {
              alert(result.error || 'Failed to connect Google');
          }
      } catch (error) {
          console.error('Google connection error:', error);
          alert('Failed to connect Google. Please try again.');
      } finally {
          setIsGoogleConnecting(false);
      }
  };


  const handleVerifyPhone = () => {
      // Mock OTP
      setOtpSent(true);
      alert(t('signup.phone.otpSentMock'));
  };

  const handleFileUpload = () => {
      // Mock upload
      const mockFile = "Trade_License_2023.pdf";
      setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), mockFile] }));
  };

  // Sub-category Data - Expanded List
  const SUB_CATEGORIES: Record<string, string[]> = {
      GASTRONOMY: [
          'Cafe', 'Restaurant', 'Bar', 'Bistro', 'Bakery', 'Food Truck', 
          'Ghost Kitchen', 'Fine Dining', 'Fast Food', 'Bubble Tea', 
          'Ice Cream Shop', 'Juice Bar', 'Brewery', 'Winery'
      ],
      RETAIL: [
          'Fashion', 'Electronics', 'Home & Decor', 'Beauty', 'Kids', 
          'Concept Store', 'Vintage', 'Bookstore', 'Pet Supply', 
          'Jewelry', 'Florist', 'Sports Equipment', 'Stationery', 'Art Gallery'
      ],
      SERVICES: [
          'Hair Salon', 'Barber', 'Spa', 'Agency', 'Repair', 'Tattoo Studio', 
          'Nail Salon', 'Massage Therapy', 'Pet Grooming', 'Dry Cleaner', 
          'Tailor', 'Photographer', 'Event Planner', 'Coworking Space'
      ],
      FITNESS: [
          'Gym', 'Yoga Studio', 'Pilates', 'CrossFit', 'Personal Training', 
          'Dance Studio', 'Martial Arts', 'Climbing Gym', 'Cycling Studio', 'Swimming Pool'
      ]
  };

  // Progress Bar Component
  const ProgressBar = () => {
      const totalSteps = 5;
      const progress = Math.min(100, (Math.max(0, formData.step) / totalSteps) * 100);
      
      return (
          <div className="w-full bg-gray-100 h-1.5 fixed top-0 left-0 z-50">
              <div 
                  className="h-full bg-gradient-to-r from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] transition-all duration-500" 
                  style={{ width: `${progress}%` }}
              ></div>
          </div>
      );
  };

  // === POST-SIGNUP SCREENS (Check these FIRST before step checks) ===
  
  // Show interests screen for customers after sign-up
  if (showInterestsScreen) {
    console.log('[SignUp] RENDERING CustomerInterestsScreen');
    return (
      <CustomerInterestsScreen
        onComplete={handleInterestsComplete}
        onSkip={handleSkipPreferences}
      />
    );
  }

  // Show maturity assessment for businesses
  if (showMaturityAssessment) {
    console.log('[SignUp] RENDERING BusinessMaturityAssessment');
    return (
      <BusinessMaturityAssessment
        formData={formData}
        onUpdate={updateField}
        onComplete={handleMaturityAssessmentComplete}
        onBack={() => setShowMaturityAssessment(false)}
      />
    );
  }

  // Show level reveal screen
  if (showLevelReveal && formData.calculatedLevel) {
    console.log('[SignUp] RENDERING LevelRevealScreen, level:', formData.calculatedLevel);
    return (
      <LevelRevealScreen
        level={formData.calculatedLevel}
        onContinue={handleLevelRevealContinue}
      />
    );
  }

  if (showLevelReveal && !formData.calculatedLevel) {
    console.log('[SignUp] showLevelReveal is true but calculatedLevel is missing:', formData.calculatedLevel);
  }

  // === SIGNUP STEPS ===

  // --- Step 0: Smart Auth ---
  if (formData.step === 0) {
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="w-full max-w-md">
                 <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] rounded-3xl text-white flex items-center justify-center shadow-2xl shadow-[#00E5FF]/40 mx-auto mb-6 rotate-3">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">{t('signup.createAccountTitle')}</h1>
                    <p className="text-[#8F8FA3] font-medium">{t('signup.createAccountSubtitle')}</p>
                 </div>

                 {/* Direct Email Signup */}
                 <div className="bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl shadow-purple-500/5 space-y-4 mb-6">
                    <Input 
                        label={t('auth.email')} 
                        value={formData.email} 
                        onChange={(e) => updateField('email', e.target.value)} 
                        placeholder={t('auth.emailPlaceholder')}
                    />
                    <Input 
                        label={t('auth.password')} 
                        type="password" 
                        value={formData.password} 
                        onChange={(e) => updateField('password', e.target.value)} 
                        placeholder={t('auth.passwordPlaceholder')}
                    />
                    <Button 
                        onClick={handleEmailSignup}
                        disabled={!formData.email || !formData.password}
                        className="w-full shadow-lg shadow-[#00E5FF]/20 py-4"
                    >
                        {t('signup.continueWithEmail')}
                    </Button>
                 </div>

                 {/* Separator */}
                 <div className="relative mb-6">
                     <div className="absolute inset-0 flex items-center">
                         <div className="w-full border-t border-gray-300/50"></div>
                     </div>
                     <div className="relative flex justify-center text-sm">
                         <span className="px-2 bg-[#F8F9FE] text-gray-400 font-bold text-xs uppercase">{t('signup.orContinueWith')}</span>
                     </div>
                 </div>

                 {/* Social Buttons */}
                 <div className="grid grid-cols-2 gap-3 mb-6">
                    <button 
                        onClick={() => { updateField('authMethod', 'APPLE'); nextStep(); }}
                        className="py-3 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10 text-sm"
                    >
                        <span className="text-lg"></span> Apple
                    </button>
                    <button 
                        onClick={handleGoogleLogin}
                        className="py-3 bg-white border border-gray-200 rounded-2xl font-bold text-[#1E0E62] flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm text-sm"
                    >
                        <Globe className="w-4 h-4 text-blue-500" /> Google
                    </button>
                 </div>

                 <div className="text-center">
                          <span className="text-[#8F8FA3] font-medium text-sm">{t('auth.alreadyHaveAccount')} </span>
                          <button onClick={onBack} className="text-[#00E5FF] font-bold text-sm hover:underline">{t('auth.signIn')}</button>
                 </div>
             </div>
          </div>
      );
  }

  // --- Step 1: The Role Fork ---
  if (formData.step === 1) {
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
              <ProgressBar />
              <div className="mt-4 mb-6">
                  <button onClick={prevStep} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-4 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <div className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider mb-1">{t('signup.stepOf', { current: 1, total: 4 })}</div>
                  <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">{t('signup.choosePathTitle')}</h1>
                  <p className="text-[#8F8FA3] font-medium">{t('signup.choosePathSubtitle')}</p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pb-6">
                  {/* Card 1: Active Business */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'BUSINESS');
                        updateField('accountType', 'business'); 
                        updateField('isAspiringBusiness', false); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-white border border-white shadow-lg shadow-purple-100 hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                              <Store className="w-6 h-6" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-[#1E0E62] mb-1">{t('signup.cards.activeBusinessTitle')}</h3>
                              <p className="text-[#8F8FA3] text-xs font-medium leading-relaxed">{t('signup.cards.activeBusinessDesc')}</p>
                          </div>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="w-5 h-5" />
                      </div>
                  </button>

                  {/* Card 2: Aspiring Business */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'BUSINESS');
                        updateField('accountType', 'business'); 
                        updateField('isAspiringBusiness', true); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-gradient-to-br from-[#1E0E62] to-[#2b148a] text-white shadow-xl shadow-[#1E0E62]/20 hover:shadow-2xl transition-all group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 backdrop-blur-sm">
                              <Rocket className="w-6 h-6" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold mb-1">{t('signup.cards.aspiringBusinessTitle')}</h3>
                              <p className="text-white/70 text-xs font-medium leading-relaxed">{t('signup.cards.aspiringBusinessDesc')}</p>
                          </div>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  </button>

                  {/* Card 3: Creator/Influencer */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'CREATOR');
                        updateField('accountType', 'creator'); 
                        updateField('isAspiringBusiness', false); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/20 hover:shadow-2xl transition-all group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 backdrop-blur-sm">
                              <Sparkles className="w-6 h-6" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold mb-1">I'm a Creator</h3>
                              <p className="text-white/70 text-xs font-medium leading-relaxed">Influencer, content creator, or freelancer looking to collaborate with brands</p>
                          </div>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                  </button>

                  {/* Card 4: Customer/Member */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'MEMBER');
                        updateField('accountType', 'creator'); 
                        updateField('isAspiringBusiness', false); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-white border border-white shadow-lg shadow-pink-100 hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 shrink-0">
                              <Smartphone className="w-6 h-6" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-[#1E0E62] mb-1">I'm a Customer</h3>
                              <p className="text-[#8F8FA3] text-xs font-medium leading-relaxed">Explore places, earn rewards, and enjoy exclusive perks</p>
                          </div>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="w-5 h-5" />
                      </div>
                  </button>
              </div>
          </div>
      );
  }

  // --- Step 2: Location & City ---
  if (formData.step === 2) {
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
              <ProgressBar />
              <div className="mt-4 mb-6">
                  <button onClick={prevStep} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-4 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <div className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider mb-1">{t('signup.stepOf', { current: 2, total: 4 })}</div>
                  <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">{t('signup.location.title')}</h1>
                  <p className="text-[#8F8FA3] font-medium">{t('signup.location.subtitle')}</p>
              </div>

              <div className="flex-1 space-y-4">
                  {/* Auto-detect location card */}
                  <button
                      onClick={handleLocationRequest}
                      disabled={isLoadingLocation}
                      className={`w-full text-left p-6 rounded-[24px] shadow-lg transition-all group relative overflow-hidden ${
                          formData.locationPermissionGranted
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/30'
                              : 'bg-white border border-gray-200 hover:shadow-xl'
                      }`}
                  >
                      <div className="flex items-center gap-4 relative z-10">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                              formData.locationPermissionGranted
                                  ? 'bg-white/20 backdrop-blur-sm'
                                  : 'bg-gradient-to-br from-purple-500 to-blue-500 animate-pulse'
                          }`}>
                              <MapPin className={`w-7 h-7 ${formData.locationPermissionGranted ? 'text-white' : 'text-white'}`} />
                          </div>
                          <div className="flex-1">
                              <h3 className={`text-lg font-bold mb-1 ${
                                  formData.locationPermissionGranted ? 'text-white' : 'text-[#1E0E62]'
                              }`}>
                                  {formData.locationPermissionGranted ? '✓ Location Detected' : 'Use Current Location'}
                              </h3>
                              <p className={`text-sm font-medium ${
                                  formData.locationPermissionGranted ? 'text-white/80' : 'text-[#8F8FA3]'
                              }`}>
                                  {formData.locationPermissionGranted 
                                      ? formData.city || 'Location detected successfully'
                                      : 'Quick and accurate - find opportunities near you'
                                  }
                              </p>
                          </div>
                          {!formData.locationPermissionGranted && (
                              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                          )}
                      </div>
                      {isLoadingLocation && (
                          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-[24px]">
                              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                      )}
                  </button>

                  {/* Separator */}
                  <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                         <div className="w-full border-t border-gray-200"></div>
                     </div>
                     <div className="relative flex justify-center text-sm">
                         <span className="px-3 bg-[#F8F9FE] text-gray-400 font-semibold text-xs uppercase tracking-wider">Or Enter Manually</span>
                     </div>
                  </div>

                  {/* Manual city input with enhanced UI */}
                  <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-focus-within:bg-[#00E5FF]/10 transition-colors">
                          <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#00E5FF] transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search for your city..."
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="w-full pl-[4.5rem] pr-4 py-5 rounded-2xl border-2 border-gray-200 bg-white focus:border-[#00E5FF] focus:ring-0 outline-none font-semibold text-[#1E0E62] placeholder:text-gray-400 placeholder:font-medium transition-all"
                      />
                      {formData.city && (
                          <button
                              onClick={() => updateField('city', '')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 transition-colors"
                          >
                              ×
                          </button>
                      )}
                  </div>

                  {/* Helper text */}
                  {formData.city && !formData.locationPermissionGranted && (
                      <div className="flex items-start gap-2 px-2">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-blue-600 text-xs font-bold">i</span>
                          </div>
                          <p className="text-sm text-[#8F8FA3] leading-relaxed">
                              Make sure to enter your city accurately to discover relevant missions and events nearby
                          </p>
                      </div>
                  )}
              </div>

              <Button onClick={() => setFormData({ ...formData, step: 3 })} disabled={!formData.city} className="w-full py-4 text-lg mt-6">
                  {t('signup.nextStep')} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
          </div>
      );
  }

  // --- Step 3: Gender Selection ---
  if (formData.step === 3) {
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
              <ProgressBar />
              <div className="mt-4 mb-6">
                  <button onClick={() => setFormData({ ...formData, step: 2 })} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-4 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider mb-1">Step 3 of 5</div>
                  <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">Tell us about yourself</h1>
                  <p className="text-[#8F8FA3] font-medium">This helps us personalize your experience</p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pb-6">
                  {/* Gender Options */}
                  <div className="space-y-3">
                      <label className="text-sm font-bold text-[#1E0E62]">Gender</label>
                      
                      {[
                          { value: 'MALE', label: 'Male', color: 'blue' },
                          { value: 'FEMALE', label: 'Female', color: 'pink' },
                          { value: 'OTHER', label: 'Other', color: 'purple' },
                          { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say', color: 'gray' }
                      ].map((option) => (
                          <button
                              key={option.value}
                              onClick={() => updateField('gender', option.value as any)}
                              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                  formData.gender === option.value
                                      ? `border-${option.color}-500 bg-${option.color}-50`
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                          >
                              <div className="flex-1 text-left">
                                  <div className="font-bold text-[#1E0E62]">{option.label}</div>
                              </div>
                              {formData.gender === option.value && (
                                  <Check className="w-5 h-5 text-green-500" />
                              )}
                          </button>
                      ))}
                  </div>
              </div>

              <Button onClick={() => setFormData({ ...formData, step: 4 })} disabled={!formData.gender} className="w-full py-4 text-lg mt-6">
                  Continue <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
          </div>
      );
  }

  // --- Step 4: Details & Verification ---
  if (formData.step === 4) {
      const isBusiness = formData.role === 'BUSINESS';
      const isAspiring = formData.isAspiringBusiness;
      const isCreator = formData.role === 'CREATOR';
      const isCustomer = formData.role === 'MEMBER';

    let headerTitle = t('signup.step3.createProfileTitle');
    let headerSub = t('signup.step3.createProfileSubtitle');

      if (isBusiness) {
          if (!isAspiring) {
              headerTitle = t('signup.step3.businessVerificationTitle');
              headerSub = t('signup.step3.businessVerificationSubtitle');
          } else {
              headerTitle = t('signup.step3.menteeProfileTitle');
              headerSub = t('signup.step3.menteeProfileSubtitle');
          }
      } else if (isCreator) {
          headerTitle = t('signup.step3.creatorProfileTitle');
          headerSub = t('signup.step3.creatorProfileSubtitle');
      } else if (isCustomer) {
          headerTitle = 'Complete Your Profile';
          headerSub = 'Just a few more details to personalize your experience';
      }

      // Business Flow (Active & Aspiring)
      if (isBusiness) {
          return (
            <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
                <ProgressBar />
                
                {/* Header */}
                <div className="mt-4 mb-4">
                    <button onClick={prevStep} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-4 flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                         <div className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider">Step 4 of 5</div>
                         <button onClick={() => setShowWhyVerify(true)} className="text-gray-400 hover:text-[#1E0E62]">
                             <Info className="w-4 h-4" />
                         </button>
                    </div>
                    <h1 className="text-2xl font-clash font-bold text-[#1E0E62] mb-1">{headerTitle}</h1>
                    <p className="text-[#8F8FA3] font-medium text-sm">{headerSub}</p>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-8">
                    
                    {/* Section A: Identity & Category */}
                    <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-[#8F8FA3]" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">
                                {isAspiring ? t('signup.identity.projectIdentity') : t('signup.identity.legalIdentity')}
                            </h3>
                         </div>
                         
                         <Input 
                            label={isAspiring ? t('signup.identity.projectBusinessName') : t('signup.identity.legalName')}
                            placeholder={isAspiring ? t('signup.identity.projectNamePlaceholder') : t('signup.identity.legalNamePlaceholder')} 
                            value={formData.legalName}
                            onChange={e => {
                                updateField('legalName', e.target.value);
                                updateField('handle', e.target.value); // Sync handle for display
                            }}
                         />
                         
                         {/* Contact Person Information */}
                         <div className="grid grid-cols-2 gap-3">
                            <Input 
                                label="First Name *"
                                placeholder="John" 
                                value={formData.firstName}
                                onChange={e => updateField('firstName', e.target.value)}
                            />
                            <Input 
                                label="Last Name *"
                                placeholder="Smith" 
                                value={formData.lastName}
                                onChange={e => updateField('lastName', e.target.value)}
                            />
                         </div>
                         
                         <Input 
                            label="Your Position/Role *"
                            placeholder="Owner, Manager, Marketing Director, etc." 
                            value={formData.position}
                            onChange={e => updateField('position', e.target.value)}
                         />
                         
                         {!isAspiring && (
                            <Input 
                                label={t('signup.identity.vatIdLabel')} 
                                placeholder={t('signup.identity.vatIdPlaceholder')} 
                                value={formData.vatId}
                                onChange={e => updateField('vatId', e.target.value)}
                            />
                         )}

                         {/* Phone Validation */}
                         <div>
                             <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1 mb-2 block">{t('auth.phoneNumber')}</label>
                             <div className="flex gap-2">
                                 <select 
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-24 px-2 py-3 rounded-2xl border border-gray-300 bg-white outline-none text-sm font-medium text-[#1E0E62] cursor-pointer"
                                 >
                                    {COUNTRY_CODES.map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                    ))}
                                 </select>
                                            <input 
                                    type="tel" 
                                                placeholder={t('signup.phone.placeholder')} 
                                    className="flex-1 px-5 py-3 rounded-2xl border border-gray-300 bg-white outline-none font-medium text-[#1E0E62]"
                                    value={formData.phone}
                                    onChange={e => updateField('phone', e.target.value)}
                                 />
                                 <button 
                                    onClick={handleVerifyPhone}
                                    disabled={!formData.phone || otpSent}
                                    className="bg-[#1E0E62] text-white px-4 rounded-2xl text-xs font-bold disabled:opacity-50"
                                 >
                                                {otpSent ? <Check className="w-4 h-4" /> : t('signup.phone.verify')}
                                 </button>
                             </div>
                                      {otpSent && <div className="text-xs text-green-600 mt-1 ml-1">{t('signup.phone.verificationSent')}</div>}
                         </div>

                         {/* Category Grid */}
                         <div className="grid grid-cols-4 gap-2 my-2">
                                 {[
                                     { id: 'GASTRONOMY', icon: Coffee, label: t('signup.categories.gastronomy') },
                                     { id: 'RETAIL', icon: ShoppingBag, label: t('signup.categories.retail') },
                                     { id: 'SERVICES', icon: Briefcase, label: t('signup.categories.services') },
                                     { id: 'FITNESS', icon: Dumbbell, label: t('signup.categories.fitness') },
                                 ].map(cat => (
                                 <button
                                    key={cat.id}
                                    onClick={() => { updateField('category', cat.id); updateField('subCategory', ''); }}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${formData.category === cat.id ? 'bg-[#1E0E62] text-white border-[#1E0E62]' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}
                                 >
                                     <cat.icon className="w-5 h-5 mb-1" />
                                     <span className="text-[10px] font-bold">{cat.label}</span>
                                 </button>
                             ))}
                         </div>
                         
                         {formData.category && (
                             <Select 
                                label={t('signup.category.subCategory')}
                                value={formData.subCategory}
                                onChange={e => updateField('subCategory', e.target.value)}
                             >
                                 <option value="">{t('signup.category.selectType')}</option>
                                 {SUB_CATEGORIES[formData.category].map(sub => (
                                     <option key={sub} value={sub}>{sub}</option>
                                 ))}
                             </Select>
                         )}
                    </div>

                    {/* Mentee Info Box */}
                    {isAspiring && (
                        <div className="bg-indigo-50 p-4 rounded-2xl text-sm text-indigo-800 border border-indigo-100 flex gap-3">
                            <Rocket className="w-5 h-5 shrink-0 mt-1" />
                            <div>
                                <p className="font-bold mb-1">{t('signup.mentee.title')}</p>
                                <p>{t('signup.mentee.desc')}</p>
                            </div>
                        </div>
                    )}

                    {/* Section: Document Upload (Only for Active Businesses) */}
                    {!isAspiring && (
                        <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <FileCheck className="w-4 h-4 text-[#8F8FA3]" />
                                <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">{t('signup.documents.title')}</h3>
                            </div>
                            <p className="text-xs text-[#8F8FA3] -mt-3 mb-2">{t('signup.documents.hint')}</p>
                            
                            {formData.documents && formData.documents.length > 0 ? (
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-green-800 font-bold">
                                        <FileCheck className="w-4 h-4" /> {formData.documents[0]}
                                    </div>
                                    <button onClick={() => updateField('documents', [])}><X className="w-4 h-4 text-gray-400"/></button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleFileUpload}
                                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors text-gray-500 text-sm font-medium flex flex-col items-center justify-center gap-2"
                                >
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    {t('signup.documents.uploadCta')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Section B: Location */}
                    <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-[#8F8FA3]" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">
                                {isAspiring ? t('signup.location.planned') : t('signup.location.anchor')}
                            </h3>
                         </div>
                                 <p className="text-xs text-[#8F8FA3] -mt-3 mb-2">{t('signup.location.matchingHint')}</p>
                         
                         {/* Operating Country Selection */}
                         <div className="space-y-2">
                            <label className="block text-sm font-semibold text-[#1E0E62]">
                                <Globe className="w-4 h-4 inline mr-2" />
                                Operating Country *
                            </label>
                            <select
                                value={operatingCountry}
                                onChange={(e) => setOperatingCountry(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#7209B7] focus:ring-2 focus:ring-[#7209B7]/20 outline-none transition-all"
                                required
                            >
                                <option value="">Select country...</option>
                                <option value="DE">🇩🇪 Germany</option>
                                <option value="AE">🇦🇪 United Arab Emirates</option>
                                <option value="CH">🇨🇭 Switzerland</option>
                                <option value="LB">🇱🇧 Lebanon</option>
                                <option value="US">🇺🇸 United States</option>
                                <option value="GB">🇬🇧 United Kingdom</option>
                                <option value="FR">🇫🇷 France</option>
                                <option value="ES">🇪🇸 Spain</option>
                                <option value="IT">🇮🇹 Italy</option>
                                <option value="AT">🇦🇹 Austria</option>
                                <option value="NL">🇳🇱 Netherlands</option>
                                <option value="BE">🇧🇪 Belgium</option>
                                <option value="SE">🇸🇪 Sweden</option>
                                <option value="NO">🇳🇴 Norway</option>
                                <option value="DK">🇩🇰 Denmark</option>
                                <option value="PL">🇵🇱 Poland</option>
                                <option value="CZ">🇨🇿 Czech Republic</option>
                                <option value="GR">🇬🇷 Greece</option>
                                <option value="PT">🇵🇹 Portugal</option>
                                <option value="TR">🇹🇷 Turkey</option>
                                <option value="SA">🇸🇦 Saudi Arabia</option>
                                <option value="QA">🇶🇦 Qatar</option>
                                <option value="KW">🇰🇼 Kuwait</option>
                                <option value="BH">🇧🇭 Bahrain</option>
                                <option value="OM">🇴🇲 Oman</option>
                                <option value="EG">🇪🇬 Egypt</option>
                                <option value="JO">🇯🇴 Jordan</option>
                                <option value="AU">🇦🇺 Australia</option>
                                <option value="CA">🇨🇦 Canada</option>
                                <option value="SG">🇸🇬 Singapore</option>
                                <option value="HK">🇭🇰 Hong Kong</option>
                                <option value="JP">🇯🇵 Japan</option>
                                <option value="KR">🇰🇷 South Korea</option>
                                <option value="CN">🇨🇳 China</option>
                                <option value="IN">🇮🇳 India</option>
                                <option value="BR">🇧🇷 Brazil</option>
                                <option value="MX">🇲🇽 Mexico</option>
                                <option value="AR">🇦🇷 Argentina</option>
                                <option value="CL">🇨🇱 Chile</option>
                                <option value="CO">🇨🇴 Colombia</option>
                                <option value="ZA">🇿🇦 South Africa</option>
                                <option value="NG">🇳🇬 Nigeria</option>
                                <option value="KE">🇰🇪 Kenya</option>
                            </select>
                            <p className="text-xs text-[#8F8FA3]">
                                Select the country where your business operates (independent of your phone number)
                            </p>
                         </div>
                         
                         <AddressAutocomplete
                            label={t('signup.address.streetLabel')}
                            placeholder={t('signup.address.streetPlaceholder')}
                            initialValue={formData.street}
                            onAddressSelect={(address) => {
                                updateField('street', address.street);
                                updateField('city', address.city);
                                updateField('zipCode', address.zipCode);
                            }}
                         />
                    </div>

                    {/* Section C: Trust & Social (Grouped) */}
                    <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-4 h-4 text-[#8F8FA3]" />
                                     <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">{t('signup.trustSocial.title')}</h3>
                         </div>
                                 <p className="text-xs text-[#8F8FA3] -mt-3 mb-3">{t('signup.trustSocial.desc')}</p>

                         {/* Connect Buttons Grid */}
                         <div className="space-y-3">
                             {/* Google - Only for Active Businesses */}
                             {!isAspiring && (
                                 <>
                                    {formData.verifiedSources?.google ? (
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                            <h4 className="font-bold text-green-800 flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="w-4 h-4"/> {t('signup.verification.verifiedFor', { name: formData.legalName || t('signup.verification.business') })}
                                            </h4>
                                            <p className="text-[10px] text-green-700 mt-1 ml-6">{t('signup.verification.addressMatched')}</p>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => simulateVerification('google')} 
                                            className="w-full flex items-center justify-between p-3 rounded-xl border bg-white border-gray-200 hover:border-blue-500 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                                    <Globe className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-[#1E0E62]">{t('signup.verification.googleBusiness')}</div>
                                                    <div className="text-[10px] text-gray-500">{t('signup.verification.verifyAddress')}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600">{t('signup.verification.verifyCta')}</span>
                                        </button>
                                    )}
                                 </>
                             )}

                             {/* Shopify - Only for Active Businesses */}
                             {!isAspiring && (
                                 <>
                                    {formData.verifiedSources?.shopify ? (
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                            <h4 className="font-bold text-green-800 flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="w-4 h-4"/> {t('signup.verification.storeConnected')}
                                            </h4>
                                            <p className="text-[10px] text-green-700 mt-1 ml-6">{t('signup.verification.inventorySyncEnabled')}</p>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => simulateVerification('shopify')} 
                                            className="w-full flex items-center justify-between p-3 rounded-xl border bg-white border-gray-200 hover:border-green-500 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                                    <ShoppingBag className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-[#1E0E62]">{t('signup.verification.shopifyPos')}</div>
                                                    <div className="text-[10px] text-gray-500">{t('signup.verification.verifyInventory')}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-green-600">{t('common.connect')}</span>
                                        </button>
                                    )}
                                 </>
                             )}

                             {/* Google Account - Optional */}
                             {!connectedAccounts.google ? (
                                <button 
                                    onClick={handleConnectGoogle}
                                    disabled={isGoogleConnecting}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-500 bg-white transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Globe className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-[#1E0E62]">Google Account</div>
                                            <div className="text-[10px] text-gray-500">Connect your Google account</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-blue-600">{isGoogleConnecting ? 'Connecting...' : t('common.connect')}</span>
                                </button>
                             ) : (
                                <div className="w-full flex items-center justify-between p-3 rounded-xl border border-green-200 bg-green-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <Globe className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-[#1E0E62]">Google Connected</div>
                                            <div className="text-[10px] text-green-700">Account linked successfully</div>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                             )}
                         </div>

                         <div className="space-y-2 pt-2">
                            <label className="flex items-start gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isAuthorized} 
                                    onChange={e => updateField('isAuthorized', e.target.checked)}
                                    className="mt-1 w-4 h-4 text-[#00E5FF] rounded border-gray-300 focus:ring-[#00E5FF]" 
                                />
                                <span className="text-xs font-medium text-[#1E0E62]">{t('signup.consent.agree')} <a href="#" className="text-blue-600 underline">{t('settings.termsOfService')}</a> {t('signup.consent.and')} <a href="#" className="text-blue-600 underline">{t('settings.privacyPolicy')}</a>.</span>
                            </label>
                            
                            <div className="flex items-start gap-2 bg-gray-50 p-2 rounded text-[10px] text-gray-500">
                                <Lock className="w-3 h-3 shrink-0 mt-0.5" />
                                {t('signup.consent.dataSecure')}
                            </div>
                         </div>
                    </div>
                </div>

                {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {submitError}
                    </div>
                )}

                <Button 
                    onClick={nextStep} 
                    disabled={
                        !formData.legalName || 
                        (!isAspiring && !formData.vatId) || 
                        !formData.isAuthorized || 
                        !formData.street
                    }
                    className="w-full py-4 text-lg shadow-xl shadow-[#1E0E62]/20"
                >
                    {t('signup.nextStep')} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {/* Why Verify Modal */}
                <Modal isOpen={showWhyVerify} onClose={() => setShowWhyVerify(false)} title={t('signup.verifyModal.title')}>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">{t('signup.verifyModal.desc')}</p>
                        <ul className="space-y-2">
                            <li className="flex gap-2 text-sm font-medium text-[#1E0E62]"><CheckCircle2 className="w-5 h-5 text-green-500"/> {t('signup.verifyModal.benefitB2B')}</li>
                            <li className="flex gap-2 text-sm font-medium text-[#1E0E62]"><CheckCircle2 className="w-5 h-5 text-green-500"/> {t('signup.verifyModal.benefitCreator')}</li>
                            <li className="flex gap-2 text-sm font-medium text-[#1E0E62]"><CheckCircle2 className="w-5 h-5 text-green-500"/> {t('signup.verifyModal.benefitBadge')}</li>
                        </ul>
                        <Button onClick={() => setShowWhyVerify(false)} className="w-full">{t('common.gotIt')}</Button>
                    </div>
                </Modal>
            </div>
          );
      }

      // Creator / Fan Flow (Comprehensive)
      console.log('[SignUp] RENDERING step 3 - Creator/Fan flow');
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
              <ProgressBar />
              <div className="mt-4 mb-6">
                  <button onClick={prevStep} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-4 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <div className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider mb-1">Step 4 of 5</div>
                  <h1 className="text-2xl font-clash font-bold text-[#1E0E62] mb-1">{headerTitle}</h1>
                  <p className="text-[#8F8FA3] font-medium text-sm">{headerSub}</p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-8">
                  
                  {/* Section A: Personal Identity */}
                  <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <UserIcon className="w-4 h-4 text-[#8F8FA3]" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">
                              {formData.role === 'MEMBER' ? 'Your Details' : t('signup.creator.personalDetails')}
                            </h3>
                         </div>
                         
                         <Input 
                                     label={t('auth.fullName')}
                                     placeholder={t('signup.creator.fullNamePlaceholder')} 
                            value={formData.legalName}
                            onChange={e => updateField('legalName', e.target.value)}
                         />

                         {/* Phone Validation */}
                         <div>
                             <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1 mb-2 block">{t('auth.phoneNumber')}</label>
                             <div className="flex gap-2">
                                 <select 
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-24 px-2 py-3 rounded-2xl border border-gray-300 bg-white outline-none text-sm font-medium text-[#1E0E62] cursor-pointer"
                                 >
                                    {COUNTRY_CODES.map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                    ))}
                                 </select>
                                            <input 
                                    type="tel" 
                                                placeholder={t('signup.phone.placeholder')} 
                                    className="flex-1 px-5 py-3 rounded-2xl border border-gray-300 bg-white outline-none font-medium text-[#1E0E62]"
                                    value={formData.phone}
                                    onChange={e => updateField('phone', e.target.value)}
                                 />
                                 <button 
                                    onClick={handleVerifyPhone}
                                    disabled={!formData.phone || otpSent}
                                    className="bg-[#1E0E62] text-white px-4 rounded-2xl text-xs font-bold disabled:opacity-50"
                                 >
                                                {otpSent ? <Check className="w-4 h-4" /> : t('signup.phone.verify')}
                                 </button>
                             </div>
                                      {otpSent && <div className="text-xs text-green-600 mt-1 ml-1">{t('signup.phone.verificationSent')}</div>}
                         </div>
                  </div>

                  {/* Section B: Home Base */}
                  <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-[#8F8FA3]" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">
                              {formData.role === 'MEMBER' ? 'Delivery Address' : t('signup.creator.shippingAddress')}
                            </h3>
                         </div>
                         <p className="text-xs text-[#8F8FA3] -mt-3 mb-2">
                           {formData.role === 'MEMBER' 
                             ? 'Where should we send your rewards and goodies?' 
                             : t('signup.creator.shippingHint')
                           }
                         </p>
                         
                         <AddressAutocomplete
                            label={t('signup.address.streetLabel')}
                            placeholder={t('signup.address.streetPlaceholder')}
                            initialValue={formData.street}
                            onAddressSelect={(address) => {
                                updateField('street', address.street);
                                updateField('city', address.city);
                                updateField('zipCode', address.zipCode);
                            }}
                         />
                  </div>

                  {/* Section C: Social Identity (Only for Creators) */}
                  {formData.role === 'CREATOR' && (
                  <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4 text-[#8F8FA3]" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">{t('signup.creator.socialIdentity')}</h3>
                         </div>
                         
                         <div>
                            <Input 
                               label="Social Media Handle (Optional)" 
                               placeholder="@yourusername"
                               value={formData.instagram || ''}
                               onChange={(e) => {
                                 const value = e.target.value.replace('@', '');
                                 updateField('instagram', value);
                                 updateField('handle', value);
                               }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                               Optional: Share your social handle to connect with businesses
                            </p>
                         </div>
                  </div>
                  )}

                  {/* Quick Interests - For Customers Only */}
                  {formData.role === 'MEMBER' && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-[24px] border border-blue-100 shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">Your Interests</h3>
                         </div>
                         <p className="text-xs text-[#8F8FA3] -mt-2">
                            Help us show you the best places and rewards
                         </p>
                         
                         <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'food', label: 'Food & Dining' },
                              { id: 'fitness', label: 'Fitness' },
                              { id: 'beauty', label: 'Beauty & Spa' },
                              { id: 'shopping', label: 'Shopping' },
                              { id: 'entertainment', label: 'Entertainment' },
                              { id: 'travel', label: 'Travel' }
                            ].map((interest) => {
                              const isSelected = formData.interests?.includes(interest.id);
                              return (
                                <button
                                  key={interest.id}
                                  onClick={() => {
                                    const current = formData.interests || [];
                                    const updated = isSelected 
                                      ? current.filter(i => i !== interest.id)
                                      : [...current, interest.id];
                                    updateField('interests', updated);
                                  }}
                                  className={`p-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg'
                                      : 'bg-white text-[#1E0E62] border border-gray-200 hover:border-blue-300'
                                  }`}
                                >
                                  <span className="text-[11px] leading-tight">{interest.label}</span>
                                  {isSelected && <Check className="w-3 h-3 ml-auto" />}
                                </button>
                              );
                            })}
                         </div>
                  </div>
                  )}

                  {/* Referral Code - For Everyone */}
                  <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-[#8F8FA3]" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">Referral Code</h3>
                         </div>
                         
                         <div>
                             <Input 
                                label={t('signup.referral.label')} 
                                placeholder={t('signup.referral.placeholder')}
                                value={formData.referralCode}
                                onChange={(e) => updateField('referralCode', e.target.value)}
                             />
                             {formData.referralCode && (
                                 <div className="bg-green-50 p-3 rounded-xl text-xs text-green-700 font-medium mt-1 flex gap-2 items-center">
                                      <Check className="w-4 h-4" /> {t('signup.referral.applied')}
                                 </div>
                             )}
                         </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="px-2">
                    <label className="flex items-start gap-3">
                        <input 
                            type="checkbox" 
                            checked={formData.isAuthorized} 
                            onChange={e => updateField('isAuthorized', e.target.checked)}
                            className="mt-1 w-4 h-4 text-[#00E5FF] rounded border-gray-300 focus:ring-[#00E5FF]" 
                        />
                        <span className="text-xs font-medium text-[#1E0E62]">{t('signup.consent.agree')} <a href="#" className="text-blue-600 underline">{t('settings.termsOfService')}</a> {t('signup.consent.and')} <a href="#" className="text-blue-600 underline">{t('settings.privacyPolicy')}</a>.</span>
                    </label>
                  </div>
              </div>

              <Button 
                onClick={nextStep} 
                disabled={
                  !formData.legalName || 
                  !formData.street || 
                  !formData.isAuthorized
                } 
                className="w-full py-4 text-lg mt-6 shadow-xl shadow-[#00E5FF]/30"
              >
                  {t('signup.nextStep')} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
          </div>
      );
  }

  // --- Step 5: Final Setup (Goals & Interests) ---
  if (formData.step === 5) {
      console.log('[SignUp] RENDERING step 5 - Goals/Vibes selection');
      const isCustomer = formData.role === 'MEMBER';
      const isBusiness = formData.role === 'BUSINESS';
      const isCreator = formData.role === 'CREATOR';
      
      // Customer rewards interests - what do they want to GET
      const CUSTOMER_REWARD_INTERESTS = [
        { id: 'free_food', label: 'Food & Drinks', desc: 'Meals, snacks, coffee' },
        { id: 'discounts', label: 'Discounts & Deals', desc: 'Coupons and special offers' },
        { id: 'fashion', label: 'Fashion & Clothing', desc: 'Clothes, shoes, accessories' },
        { id: 'beauty', label: 'Beauty Products', desc: 'Makeup, skincare, haircare' },
        { id: 'jewelry', label: 'Jewelry & Accessories', desc: 'Rings, necklaces, watches' },
        { id: 'tech', label: 'Tech & Gadgets', desc: 'Electronics, accessories' },
        { id: 'fitness', label: 'Fitness & Wellness', desc: 'Gym passes, supplements' },
        { id: 'home', label: 'Home & Lifestyle', desc: 'Decor, furniture, tools' },
        { id: 'pet', label: 'Pet Products', desc: 'Pet food, toys, supplies' },
        { id: 'experiences', label: 'Experiences', desc: 'Events, classes, activities' },
        { id: 'gift_cards', label: 'Gift Cards', desc: 'Store credit and vouchers' },
        { id: 'entertainment', label: 'Entertainment', desc: 'Movies, games, books' }
      ];

      // Creator collaboration interests - what types of work they want
      const CREATOR_INTERESTS = [
        { id: 'photographer', label: 'Photographer', desc: 'Professional photography' },
        { id: 'videographer', label: 'Videographer', desc: 'Video production & filming' },
        { id: 'content_creator', label: 'Content Creator', desc: 'Social media content' },
        { id: 'influencer', label: 'Influencer', desc: 'Social media influence' },
        { id: 'model', label: 'Model', desc: 'Fashion & product modeling' },
        { id: 'makeup_artist', label: 'Makeup Artist', desc: 'Beauty & makeup services' },
        { id: 'hair_stylist', label: 'Hair Stylist', desc: 'Hair styling & design' },
        { id: 'graphic_designer', label: 'Graphic Designer', desc: 'Visual design & branding' },
        { id: 'video_editor', label: 'Video Editor', desc: 'Post-production editing' },
        { id: 'copywriter', label: 'Copywriter', desc: 'Marketing & ad copy' },
        { id: 'blogger', label: 'Blogger', desc: 'Blog writing & articles' },
        { id: 'vlogger', label: 'Vlogger', desc: 'Video blogging' },
        { id: 'podcaster', label: 'Podcaster', desc: 'Podcast creation' },
        { id: 'voice_actor', label: 'Voice Actor', desc: 'Voiceovers & narration' },
        { id: 'musician', label: 'Musician', desc: 'Music & audio creation' },
        { id: 'dj', label: 'DJ', desc: 'Music mixing & events' },
        { id: 'dancer', label: 'Dancer', desc: 'Dance & choreography' },
        { id: 'actor', label: 'Actor', desc: 'Acting & performance' },
        { id: 'comedian', label: 'Comedian', desc: 'Comedy & entertainment' },
        { id: 'animator', label: 'Animator', desc: 'Animation & motion graphics' },
        { id: 'illustrator', label: 'Illustrator', desc: 'Digital & traditional art' },
        { id: 'web_designer', label: 'Web Designer', desc: 'Website design & UX' },
        { id: 'social_media_manager', label: 'Social Media Manager', desc: 'Account management' },
        { id: 'brand_strategist', label: 'Brand Strategist', desc: 'Brand consulting' },
        { id: 'marketing_consultant', label: 'Marketing Consultant', desc: 'Marketing strategy' },
        { id: 'seo_specialist', label: 'SEO Specialist', desc: 'Search optimization' },
        { id: 'pr_specialist', label: 'PR Specialist', desc: 'Public relations' },
        { id: 'event_planner', label: 'Event Planner', desc: 'Event organization' },
        { id: 'stylist', label: 'Stylist', desc: 'Fashion styling' },
        { id: 'interior_designer', label: 'Interior Designer', desc: 'Space design' },
        { id: 'chef', label: 'Chef/Food Creator', desc: 'Culinary content' },
        { id: 'fitness_trainer', label: 'Fitness Trainer', desc: 'Fitness & wellness' },
        { id: 'nutritionist', label: 'Nutritionist', desc: 'Nutrition coaching' },
        { id: 'life_coach', label: 'Life Coach', desc: 'Personal development' },
        { id: 'teacher', label: 'Teacher/Educator', desc: 'Educational content' },
        { id: 'tech_reviewer', label: 'Tech Reviewer', desc: 'Tech reviews & unboxing' },
        { id: 'gaming_creator', label: 'Gaming Creator', desc: 'Gaming & esports' },
        { id: 'travel_creator', label: 'Travel Creator', desc: 'Travel content' },
        { id: 'pet_influencer', label: 'Pet Influencer', desc: 'Pet-focused content' },
        { id: 'parent_influencer', label: 'Parent Influencer', desc: 'Parenting content' }
      ];

      // Business goals - what do they want to ACHIEVE
      const BUSINESS_GOALS = [
        { id: 'more_followers', label: 'Social Media Growth', desc: 'Grow your social media presence' },
        { id: 'foot_traffic', label: 'Foot Traffic', desc: 'More customers visiting location' },
        { id: 'online_sales', label: 'Online Sales', desc: 'Increase e-commerce revenue' },
        { id: 'brand_awareness', label: 'Brand Awareness', desc: 'Get known in the community' },
        { id: 'reviews', label: 'Reviews & Ratings', desc: 'Build trust and credibility' },
        { id: 'ugc', label: 'User Content', desc: 'Photos, videos, testimonials' },
        { id: 'email_list', label: 'Email Subscribers', desc: 'Build marketing list' },
        { id: 'events', label: 'Event Attendance', desc: 'Fill workshops and meetups' },
        { id: 'loyalty', label: 'Customer Loyalty', desc: 'Repeat customers' },
        { id: 'partnerships', label: 'Collaborations', desc: 'Work with creators' },
        { id: 'product_testing', label: 'Product Feedback', desc: 'Test new products' },
        { id: 'local_buzz', label: 'Local Buzz', desc: 'Word-of-mouth marketing' }
      ];

      // Business aesthetic tags (kept for businesses)
      const BUSINESS_TAGS = ['Luxury', 'Boho', 'Streetwear', 'Eco-Friendly', 'Minimalist', 'High-Tech', 'Cozy', 'Industrial', 'Vintage', 'Artsy'];
      
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
              <ProgressBar />
              <div className="mt-4 mb-6">
                  <button onClick={prevStep} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-6 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <div className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider mb-1">Step 5 of 5</div>
                  <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">
                    {isCustomer ? "What Rewards Do You Want?" : isCreator ? "What's Your Expertise?" : "What Are Your Goals?"}
                  </h1>
                  <p className="text-[#8F8FA3] font-medium">
                    {isCustomer 
                      ? "Select at least 3 categories so we can match you with the best missions and rewards" 
                      : isCreator
                      ? "Select your primary skill, then add any additional capabilities you offer"
                      : "Tell us what you want to achieve so we can help you create effective missions"
                    }
                  </p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-4">
                  {/* Customer Reward Interests */}
                  {isCustomer ? (
                      <div>
                          <h3 className="font-bold text-[#1E0E62] mb-1">Select your reward preferences:</h3>
                          <p className="text-xs text-[#8F8FA3] mb-4">Choose at least 3 categories (the more you select, the better we can match you)</p>
                          <div className="grid grid-cols-2 gap-3">
                              {CUSTOMER_REWARD_INTERESTS.map(interest => {
                                  const active = formData.vibes.includes(interest.id);
                                  return (
                                      <button
                                        key={interest.id}
                                        onClick={() => toggleVibe(interest.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left relative ${
                                            active 
                                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                      >
                                          {active && (
                                            <div className="absolute top-2 right-2">
                                              <Check className="w-4 h-4 text-blue-600" />
                                            </div>
                                          )}
                                          <div className={`text-sm font-bold mb-1 ${active ? 'text-blue-600' : 'text-[#1E0E62]'}`}>
                                            {interest.label}
                                          </div>
                                          <div className="text-xs text-gray-500">{interest.desc}</div>
                                      </button>
                                  );
                              })}
                          </div>
                          
                          {/* Selected count indicator */}
                          {formData.vibes.length > 0 && (
                              <div className="mt-4 text-center">
                                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                                      formData.vibes.length >= 3 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                      {formData.vibes.length >= 3 ? <Check className="w-4 h-4" /> : <span>•</span>} {formData.vibes.length} selected
                                      {formData.vibes.length < 3 && ` (${3 - formData.vibes.length} more needed)`}
                                  </div>
                              </div>
                          )}
                      </div>
                  ) : isCreator ? (
                      // Creator Skills Selection
                      <div className="space-y-6">
                          {/* Primary Skill Selection */}
                          <div>
                              <h3 className="font-bold text-[#1E0E62] mb-1">What is your primary expertise?</h3>
                              <p className="text-xs text-[#8F8FA3] mb-4">Select your main professional skill or role</p>
                              <div className="grid grid-cols-2 gap-3">
                                  {CREATOR_INTERESTS.map(skill => {
                                      const isSelected = formData.vibes.length > 0 && formData.vibes[0] === skill.id;
                                      return (
                                          <button
                                            key={skill.id}
                                            onClick={() => {
                                              // Replace first item (primary skill)
                                              const additionalSkills = formData.vibes.slice(1);
                                              updateField('vibes', [skill.id, ...additionalSkills]);
                                            }}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left relative ${
                                                isSelected 
                                                ? 'border-purple-600 bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg' 
                                                : 'border-gray-200 bg-white hover:border-purple-300'
                                            }`}
                                          >
                                              {isSelected && (
                                                <div className="absolute top-2 right-2">
                                                  <Check className="w-4 h-4 text-white" />
                                                </div>
                                              )}
                                              <div className={`text-sm font-bold mb-1 ${isSelected ? 'text-white' : 'text-[#1E0E62]'}`}>
                                                {skill.label}
                                              </div>
                                              <div className={`text-xs ${isSelected ? 'text-purple-100' : 'text-gray-500'}`}>{skill.desc}</div>
                                          </button>
                                      );
                                  })}
                              </div>
                              
                              {formData.vibes.length > 0 && (
                                  <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                                      <div className="flex items-center gap-2 text-sm">
                                          <Check className="w-4 h-4 text-purple-600" />
                                          <span className="text-purple-900 font-bold">Primary: {CREATOR_INTERESTS.find(s => s.id === formData.vibes[0])?.label}</span>
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* Additional Skills Selection */}
                          {formData.vibes.length > 0 && (
                              <div>
                                  <h3 className="font-bold text-[#1E0E62] mb-1">Additional skills (optional)</h3>
                                  <p className="text-xs text-[#8F8FA3] mb-4">Select any other skills you can offer to businesses</p>
                                  <div className="grid grid-cols-2 gap-3">
                                      {CREATOR_INTERESTS
                                        .filter(skill => skill.id !== formData.vibes[0]) // Exclude primary skill
                                        .map(skill => {
                                          const isSelected = formData.vibes.slice(1).includes(skill.id);
                                          return (
                                              <button
                                                key={skill.id}
                                                onClick={() => {
                                                  const primarySkill = formData.vibes[0];
                                                  const additionalSkills = formData.vibes.slice(1);
                                                  const updated = isSelected
                                                    ? additionalSkills.filter(s => s !== skill.id)
                                                    : [...additionalSkills, skill.id];
                                                  updateField('vibes', [primarySkill, ...updated]);
                                                }}
                                                className={`p-4 rounded-2xl border-2 transition-all text-left relative ${
                                                    isSelected 
                                                    ? 'border-purple-500 bg-purple-50 shadow-md' 
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                              >
                                                  {isSelected && (
                                                    <div className="absolute top-2 right-2">
                                                      <Check className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                  )}
                                                  <div className={`text-sm font-bold mb-1 ${isSelected ? 'text-purple-600' : 'text-[#1E0E62]'}`}>
                                                    {skill.label}
                                                  </div>
                                                  <div className="text-xs text-gray-500">{skill.desc}</div>
                                              </button>
                                          );
                                      })}
                                  </div>
                                  
                                  {/* Selected count indicator */}
                                  {formData.vibes.length > 1 && (
                                      <div className="mt-4 text-center">
                                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                                              <Check className="w-4 h-4" /> {formData.vibes.length - 1} additional skill{formData.vibes.length > 2 ? 's' : ''} selected
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  ) : (
                      // Business Goals & Preferences
                      <>
                          {/* Business Mode Selection */}
                          <div>
                              <h3 className="font-bold text-[#1E0E62] mb-2">{t('signup.final.businessMode')}</h3>
                              <p className="text-xs text-[#8F8FA3] mb-3">{t('signup.final.customerInteract')}</p>
                              <div className="grid grid-cols-3 gap-3">
                                  <button
                                      type="button"
                                      onClick={() => updateField('businessMode', 'PHYSICAL')}
                                      className={`p-4 rounded-2xl border-2 transition-all relative ${
                                          formData.businessMode === 'PHYSICAL'
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 bg-white hover:border-gray-300'
                                      }`}
                                  >
                                      {formData.businessMode === 'PHYSICAL' && (
                                        <div className="absolute top-2 right-2">
                                          <Check className="w-4 h-4 text-blue-600" />
                                        </div>
                                      )}
                                      <Store className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                      <div className="text-xs font-bold text-[#1E0E62]">{t('signup.final.mode.physical')}</div>
                                      <div className="text-[10px] text-gray-500">{t('signup.final.mode.physicalDesc')}</div>
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => updateField('businessMode', 'ONLINE')}
                                      className={`p-4 rounded-2xl border-2 transition-all relative ${
                                          formData.businessMode === 'ONLINE'
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 bg-white hover:border-gray-300'
                                      }`}
                                  >
                                      {formData.businessMode === 'ONLINE' && (
                                        <div className="absolute top-2 right-2">
                                          <Check className="w-4 h-4 text-blue-600" />
                                        </div>
                                      )}
                                      <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                      <div className="text-xs font-bold text-[#1E0E62]">{t('signup.final.mode.online')}</div>
                                      <div className="text-[10px] text-gray-500">{t('signup.final.mode.onlineDesc')}</div>
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => updateField('businessMode', 'HYBRID')}
                                      className={`p-4 rounded-2xl border-2 transition-all relative ${
                                          formData.businessMode === 'HYBRID'
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 bg-white hover:border-gray-300'
                                      }`}
                                  >
                                      {formData.businessMode === 'HYBRID' && (
                                        <div className="absolute top-2 right-2">
                                          <Check className="w-4 h-4 text-blue-600" />
                                        </div>
                                      )}
                                      <Globe className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                      <div className="text-xs font-bold text-[#1E0E62]">{t('signup.final.mode.hybrid')}</div>
                                      <div className="text-[10px] text-gray-500">{t('signup.final.mode.hybridDesc')}</div>
                                  </button>
                              </div>
                          </div>

                          {/* Business Goals - what they want to achieve */}
                          <div>
                              <h3 className="font-bold text-[#1E0E62] mb-1">Select your business goals:</h3>
                              <p className="text-xs text-[#8F8FA3] mb-4">Choose your top 3-5 marketing objectives</p>
                              <div className="grid grid-cols-2 gap-3">
                                  {BUSINESS_GOALS.map(goal => {
                                      const active = formData.vibes.includes(goal.id);
                                      return (
                                          <button
                                            key={goal.id}
                                            onClick={() => toggleVibe(goal.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-left relative ${
                                                active 
                                                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                          >
                                              {active && (
                                                <div className="absolute top-2 right-2">
                                                  <Check className="w-4 h-4 text-indigo-600" />
                                                </div>
                                              )}
                                              <div className={`text-sm font-bold mb-1 ${active ? 'text-indigo-600' : 'text-[#1E0E62]'}`}>
                                                {goal.label}
                                              </div>
                                              <div className="text-xs text-gray-500">{goal.desc}</div>
                                          </button>
                                      );
                                  })}
                              </div>
                              
                              {/* Selected count indicator */}
                              {formData.vibes.length > 0 && (
                                  <div className="mt-4 text-center">
                                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                                          formData.vibes.length >= 3 
                                          ? 'bg-indigo-100 text-indigo-700' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                          {formData.vibes.length >= 3 ? <Check className="w-4 h-4" /> : <span>•</span>} {formData.vibes.length} selected
                                          {formData.vibes.length < 3 && ` (${3 - formData.vibes.length} more recommended)`}
                                      </div>
                                  </div>
                              )}
                          </div>

                          {/* Business Aesthetic Tags */}
                          <div>
                              <h3 className="font-bold text-[#1E0E62] mb-2">Brand Aesthetic (optional)</h3>
                              <p className="text-xs text-[#8F8FA3] mb-3">Help creators understand your brand vibe</p>
                              <div className="flex flex-wrap gap-3">
                                  {BUSINESS_TAGS.map(tag => {
                                      const active = formData.vibes.includes(tag);
                                      return (
                                          <button
                                            key={tag}
                                            onClick={() => toggleVibe(tag)}
                                            className={`px-5 py-3 rounded-full font-bold text-sm transition-all duration-200 active:scale-95 border ${
                                                active 
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white border-transparent shadow-lg shadow-pink-200' 
                                                : 'bg-white text-[#1E0E62] border-gray-200 hover:border-gray-300'
                                            }`}
                                          >
                                              {tag}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      </>
                  )}
              </div>

              {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mt-4">
                      {submitError}
                  </div>
              )}

              <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || (isCustomer ? formData.vibes.length < 3 : formData.vibes.length < 1)}
                  isLoading={isSubmitting}
                  className="w-full py-4 text-lg mt-4 shadow-xl shadow-[#00E5FF]/30"
              >
                  {isSubmitting 
                    ? t('signup.submitting') 
                    : isCustomer 
                      ? formData.vibes.length >= 3 
                        ? `Start Earning Rewards! 🎉`
                        : `Select ${3 - formData.vibes.length} More to Continue`
                      : isCreator
                        ? formData.vibes.length >= 1
                          ? `Complete Setup! 🚀`
                          : `Select Your Primary Skill to Continue`
                      : (formData.role === 'BUSINESS' && !formData.isAspiringBusiness) 
                        ? formData.vibes.length >= 3
                          ? t('signup.final.submitApplication')
                          : `Select ${3 - formData.vibes.length} More Goals`
                        : formData.vibes.length >= 3
                          ? t('signup.final.finishSetup')
                          : `Select ${3 - formData.vibes.length} More to Continue`
                  }
              </Button>
          </div>
      );
  }

  return null;
};
