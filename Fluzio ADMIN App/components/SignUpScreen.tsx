
import React, { useState, useEffect } from 'react';
import { OnboardingState, BusinessCategory } from '../types';
import { Button, Input, Select, Modal, Card } from './Common';
import { Store, Sparkles, ArrowRight, ArrowLeft, Check, Smartphone, Rocket, MapPin, Search, Mail, ShoppingBag, Globe, DownloadCloud, Instagram, X, Briefcase, Dumbbell, Coffee, CheckCircle2, Building2, FileText, ShieldCheck, Upload, Info, Linkedin, Phone, FileCheck, Lock, User as UserIcon } from 'lucide-react';
import { api } from '../services/apiService';
import { useAuth } from '../services/AuthContext';
import { getCurrentLocation } from '../services/locationService';
import { useTranslation } from 'react-i18next';
import { CustomerInterestsScreen } from './CustomerInterestsScreen';
import { BusinessGoalsScreen } from './BusinessGoalsScreen';

interface SignUpScreenProps {
  onComplete: (data: OnboardingState) => void;
  onBack: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onComplete, onBack }) => {
  const { signInWithGoogle, signInWithApple, signUpWithEmail, user, refreshUserProfile } = useAuth();
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
    handle: '',
    city: '',
    category: 'GASTRONOMY',
    businessMode: 'PHYSICAL',
    website: '',
    instagram: '',
    referralCode: '',
    vibes: [],
    // New Fields
    legalName: '',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    vatId: '',
    registrationNumber: '',
    street: '',
    zipCode: '',
    phone: '',
    linkedin: '',
    documents: [],
    isAuthorized: false,
    verifiedSources: { google: false, shopify: false },
    subCategory: ''
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isInstagramConnecting, setIsInstagramConnecting] = useState(false);
  const [showWhyVerify, setShowWhyVerify] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+49');
  const [showInterestsScreen, setShowInterestsScreen] = useState(false);
  const [showGoalsScreen, setShowGoalsScreen] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4); // 0-4 scale
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength === 0) return 'bg-gray-200';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength === 0) return '';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const toggleVibe = (tag: string) => {
    const current = formData.vibes;
    if (current.includes(tag)) {
        updateField('vibes', current.filter(t => t !== tag));
    } else {
        if (current.length < 3) {
            updateField('vibes', [...current, tag]);
        }
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
          if (firebaseUser.phoneNumber) {
              // Remove country code prefix if present
              const phone = firebaseUser.phoneNumber.replace(/^\+49/, '').trim();
              updateField('phone', phone);
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
  setIsSubmitting(true);
  setSubmitError(null);

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
      console.log("Firebase user created:", firebaseUser.uid);
    }

    // 2) ENSURE FIRESTORE USER DOC EXISTS (createuser)
    const initialUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || formData.email,
      role: formData.role,                   // from Step 1
      authMethod: formData.authMethod,
      isAspiringBusiness: formData.isAspiringBusiness,
      step: formData.step,
    };

    console.log("Creating/ensuring initial Firestore user:", initialUserData);
    const createResult = await api.createUser(initialUserData as any);
        if (!createResult.success) {
            throw new Error(createResult.error || t('signup.createProfileFailed'));
    }

    // 3) UPDATE FULL PROFILE (updateuser)
    const completeUserData = {
      ...formData,
      uid: firebaseUser.uid,
      email: firebaseUser.email || formData.email,
      // Map firstName/lastName to 'name' field, or use legalName/handle as fallback
      name: formData.firstName && formData.lastName 
        ? `${formData.firstName} ${formData.lastName}`
        : (formData.legalName || formData.handle || formData.email.split('@')[0]),
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      countryCode: countryCode, // Save selected country code
      profileComplete: formData.step === 4,   // optional: true only on final step
      updatedAt: new Date().toISOString(),
      // Map vibes to proper fields for personalization
      vibeTags: formData.vibes || [],  // Store as vibeTags for display
      vibe: formData.vibes || [],       // Store as vibe for legacy support
      interests: formData.role === 'CREATOR' || formData.role === 'MEMBER' ? formData.vibes : undefined,  // For customers and creators
      businessGoals: formData.role === 'BUSINESS' ? formData.vibes : undefined,  // For businesses, map to goals
    };

    console.log("Updating user profile:", completeUserData);

    const result = await api.updateUser(firebaseUser.uid, completeUserData as any);

    if (result.success) {
      console.log("User profile updated successfully!");
      
      // Refresh the user profile in AuthContext now that Firestore document exists
      await refreshUserProfile();
      
      // Show interests/goals screen based on role
      if (formData.role === 'CREATOR') {
        setShowInterestsScreen(true);
      } else if (formData.role === 'MEMBER') {
        // Customers also get interests screen
        setShowInterestsScreen(true);
      } else if (formData.role === 'BUSINESS') {
        setShowGoalsScreen(true);
      } else {
        onComplete(formData);
      }
    } else {
      setSubmitError(result.error || t('signup.updateAccountFailed'));
    }
  } catch (error: any) {
    console.error("Signup error:", error);
    
    // Handle specific Firebase auth errors
    if (error?.code === 'auth/email-already-in-use') {
      setSubmitError('This email is already registered. Please log in instead or use a different email.');
    } else if (error?.code === 'auth/invalid-email') {
      setSubmitError('Invalid email address. Please check and try again.');
    } else if (error?.code === 'auth/weak-password') {
      setSubmitError('Password is too weak. Please use a stronger password.');
    } else if (error?.message) {
      setSubmitError(error.message);
    } else {
      setSubmitError(t('errors.genericError'));
    }
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

  const handleGoalsComplete = async (goals: string[]) => {
    // Save business goals to user profile
    try {
      if (user?.uid) {
        await api.updateUser(user.uid, { businessGoals: goals });
      }
    } catch (error) {
      console.error('Error saving business goals:', error);
    }
    onComplete(formData);
  };

  const handleSkipPreferences = () => {
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

  const handleConnectInstagram = (isCreator = false) => {
      setIsInstagramConnecting(true);
      // Simulate OAuth interaction
      setTimeout(() => {
          const mockHandle = isCreator ? '@alex_creator' : '@beanandbrew_official';
          updateField('instagram', mockHandle);
          // Also set handle if it's creator flow for consistent display
          if (isCreator) {
              updateField('handle', mockHandle);
          }
          setIsInstagramConnecting(false);
      }, 2000);
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
      const totalSteps = 4;
      const progress = Math.min(100, (Math.max(0, formData.step) / totalSteps) * 100);
      
      return (
          <div className="w-full bg-gray-100 h-1.5 fixed top-0 left-0 z-50">
              <div 
                  className="h-full bg-gradient-to-r from-[#FFC300] via-[#F72585] to-[#7209B7] transition-all duration-500" 
                  style={{ width: `${progress}%` }}
              ></div>
          </div>
      );
  };

  // --- Step 0: Smart Auth ---
  if (formData.step === 0) {
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="w-full max-w-md">
                 <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#FFC300] via-[#F72585] to-[#7209B7] rounded-3xl text-white flex items-center justify-center shadow-2xl shadow-[#F72585]/40 mx-auto mb-6 rotate-3">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">{t('signup.createAccountTitle')}</h1>
                    <p className="text-[#8F8FA3] font-medium">{t('signup.createAccountSubtitle')}</p>
                 </div>

                 {/* Direct Email Signup */}
                 <div className="bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl shadow-purple-500/5 space-y-4 mb-6">
                    <div>
                        <Input 
                            label={t('auth.email')} 
                            value={formData.email} 
                            onChange={(e) => {
                                updateField('email', e.target.value);
                                if (e.target.value && !validateEmail(e.target.value)) {
                                    setEmailError('Please enter a valid email address');
                                } else {
                                    setEmailError('');
                                }
                            }} 
                            placeholder={t('auth.emailPlaceholder')}
                        />
                        {emailError && (
                            <div className="text-xs text-red-600 mt-1 ml-1">{emailError}</div>
                        )}
                    </div>
                    
                    <div>
                        <Input 
                            label={t('auth.password')} 
                            type="password" 
                            value={formData.password} 
                            onChange={(e) => {
                                const pwd = e.target.value;
                                updateField('password', pwd);
                                const strength = checkPasswordStrength(pwd);
                                setPasswordStrength(strength);
                                if (pwd && pwd.length < 8) {
                                    setPasswordError('Password must be at least 8 characters');
                                } else {
                                    setPasswordError('');
                                }
                            }} 
                            placeholder={t('auth.passwordPlaceholder')}
                        />
                        {formData.password && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div 
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all ${
                                                passwordStrength >= level ? getPasswordStrengthColor(passwordStrength) : 'bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-medium ${
                                        passwordStrength <= 2 ? 'text-red-600' : 
                                        passwordStrength === 3 ? 'text-yellow-600' : 
                                        'text-green-600'
                                    }`}>
                                        {getPasswordStrengthLabel(passwordStrength)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Use 8+ chars, mix case, numbers & symbols
                                    </span>
                                </div>
                            </div>
                        )}
                        {passwordError && (
                            <div className="text-xs text-red-600 mt-1 ml-1">{passwordError}</div>
                        )}
                    </div>
                    
                    <Button 
                        onClick={handleEmailSignup}
                        disabled={!formData.email || !formData.password || !validateEmail(formData.email) || formData.password.length < 8}
                        className="w-full shadow-lg shadow-[#F72585]/20 py-4"
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
                          <button onClick={onBack} className="text-[#F72585] font-bold text-sm hover:underline">{t('auth.signIn')}</button>
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
                  <div className="text-xs font-bold text-[#F72585] uppercase tracking-wider mb-1">{t('signup.stepOf', { current: 1, total: 4 })}</div>
                  <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">{t('signup.choosePathTitle')}</h1>
                  <p className="text-[#8F8FA3] font-medium">{t('signup.choosePathSubtitle')}</p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pb-6">
                  {/* Card 1: Active Business */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'BUSINESS'); 
                        updateField('isAspiringBusiness', false); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-white border-2 border-transparent hover:border-blue-500 shadow-lg shadow-purple-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                              <Store className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                              <h3 className="text-lg font-bold text-[#1E0E62] mb-1 group-hover:text-blue-600 transition-colors">{t('signup.cards.activeBusinessTitle')}</h3>
                              <p className="text-[#8F8FA3] text-xs font-medium leading-relaxed">{t('signup.cards.activeBusinessDesc')}</p>
                              <div className="mt-2 flex gap-2">
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">Marketing</span>
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">Growth</span>
                              </div>
                          </div>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200 group-hover:translate-x-2 group-hover:text-blue-500 transition-all">
                          <ArrowRight className="w-6 h-6" />
                      </div>
                  </button>

                  {/* Card 2: Aspiring Business */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'BUSINESS'); 
                        updateField('isAspiringBusiness', true); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-gradient-to-br from-[#1E0E62] to-[#2b148a] text-white shadow-xl shadow-[#1E0E62]/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 backdrop-blur-sm group-hover:scale-110 group-hover:bg-white/20 transition-all">
                              <Rocket className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                              <h3 className="text-lg font-bold mb-1">{t('signup.cards.aspiringBusinessTitle')}</h3>
                              <p className="text-white/70 text-xs font-medium leading-relaxed">{t('signup.cards.aspiringBusinessDesc')}</p>
                              <div className="mt-2 flex gap-2">
                                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full font-medium">Mentorship</span>
                                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-full font-medium">Launch</span>
                              </div>
                          </div>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 group-hover:translate-x-2 group-hover:text-white transition-all">
                          <ArrowRight className="w-6 h-6" />
                      </div>
                  </button>

                  {/* Card 3: Customer */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'MEMBER'); 
                        updateField('isAspiringBusiness', false); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-white border-2 border-transparent hover:border-pink-500 shadow-lg shadow-pink-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-14 h-14 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl flex items-center justify-center text-pink-500 shrink-0 group-hover:scale-110 transition-transform">
                              <Smartphone className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                              <h3 className="text-lg font-bold text-[#1E0E62] mb-1 group-hover:text-pink-600 transition-colors">I'm a Customer</h3>
                              <p className="text-[#8F8FA3] text-xs font-medium leading-relaxed">Discover local businesses and earn rewards for your visits and engagement.</p>
                              <div className="mt-2 flex gap-2">
                                <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full font-medium">Rewards</span>
                                <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full font-medium">Discover</span>
                              </div>
                          </div>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-200 group-hover:translate-x-2 group-hover:text-pink-500 transition-all">
                          <ArrowRight className="w-6 h-6" />
                      </div>
                  </button>
                  
                  {/* Card 4: Creator/Influencer */}
                  <button 
                    onClick={() => { 
                        updateField('role', 'CREATOR'); 
                        updateField('isAspiringBusiness', false); 
                        nextStep();
                    }}
                    className="w-full text-left p-5 rounded-[24px] bg-white border-2 border-transparent hover:border-purple-500 shadow-lg shadow-purple-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center text-purple-500 shrink-0 group-hover:scale-110 transition-transform">
                              <Sparkles className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                              <h3 className="text-lg font-bold text-[#1E0E62] mb-1 group-hover:text-purple-600 transition-colors">I'm a Creator</h3>
                              <p className="text-[#8F8FA3] text-xs font-medium leading-relaxed">Join as a content creator or influencer to collaborate with businesses.</p>
                              <div className="mt-2 flex gap-2">
                                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full font-medium">Collaborate</span>
                                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full font-medium">Earn</span>
                              </div>
                          </div>
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-200 group-hover:translate-x-2 group-hover:text-purple-500 transition-all">
                          <ArrowRight className="w-6 h-6" />
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
                  <div className="text-xs font-bold text-[#F72585] uppercase tracking-wider mb-1">{t('signup.stepOf', { current: 2, total: 4 })}</div>
                  <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">{t('signup.location.title')}</h1>
                  <p className="text-[#8F8FA3] font-medium">{t('signup.location.subtitle')}</p>
              </div>

              <div className="flex-1">
                  <div className="bg-white p-6 rounded-[32px] shadow-lg shadow-purple-500/5 border border-white text-center mb-6">
                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 animate-pulse">
                          <MapPin className="w-8 h-8" />
                      </div>
                             <h3 className="font-bold text-[#1E0E62] text-lg mb-2">{t('signup.location.whereBased')}</h3>
                             <p className="text-sm text-[#8F8FA3] mb-6">{t('signup.location.enableLocation')}</p>
                      
                      <Button 
                        variant="gradient" 
                        className="w-full py-3.5 text-sm" 
                        onClick={handleLocationRequest}
                        isLoading={isLoadingLocation}
                      >
                                 {formData.locationPermissionGranted ? t('signup.location.locationFound') : t('signup.location.shareCurrentLocation')}
                      </Button>
                  </div>

                  <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                         <div className="w-full border-t border-gray-200"></div>
                     </div>
                     <div className="relative flex justify-center text-sm mb-6">
                         <span className="px-2 bg-[#F8F9FE] text-gray-400 font-medium">{t('signup.location.searchManually')}</span>
                     </div>
                  </div>

                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder={t('signup.location.searchCityPlaceholder')}
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white focus:border-[#F72585] focus:ring-0 outline-none font-medium text-[#1E0E62]"
                      />
                  </div>
              </div>

              <Button onClick={nextStep} disabled={!formData.city} className="w-full py-4 text-lg mt-6">
                  {t('signup.nextStep')} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
          </div>
      );
  }

  // --- Step 3: Details & Verification ---
  if (formData.step === 3) {
      const isBusiness = formData.role === 'BUSINESS';
      const isAspiring = formData.isAspiringBusiness;

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
      } else {
          headerTitle = t('signup.step3.creatorProfileTitle');
          headerSub = t('signup.step3.creatorProfileSubtitle');
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
                         <div className="text-xs font-bold text-[#F72585] uppercase tracking-wider">{t('signup.stepOf', { current: 3, total: 4 })}</div>
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

                         {/* LinkedIn */}
                         <div className="relative">
                              <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1 mb-2 block">
                                  {isAspiring ? t('signup.linkedin.founder') : t('signup.linkedin.ownerOptional')}
                              </label>
                              <div className="relative">
                                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                                                                    <input 
                                    type="text" 
                                                                        placeholder={t('signup.linkedin.placeholder')}
                                    value={formData.linkedin}
                                    onChange={e => updateField('linkedin', e.target.value)}
                                    className="w-full pl-10 px-5 py-3 rounded-2xl border border-gray-300 bg-white outline-none font-medium text-[#1E0E62]"
                                  />
                              </div>
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
                         
                         <Input 
                            label={t('signup.address.streetLabel')} 
                            placeholder={t('signup.address.streetPlaceholder')} 
                            value={formData.street}
                            onChange={e => updateField('street', e.target.value)}
                         />
                         <div className="flex gap-4">
                             <div className="w-1/3">
                                <Input 
                                    label={t('signup.address.zipLabel')} 
                                    placeholder={t('signup.address.zipPlaceholder')} 
                                    value={formData.zipCode}
                                    onChange={e => updateField('zipCode', e.target.value)}
                                />
                             </div>
                             <div className="flex-1">
                                <Input 
                                    label={t('profile.city')} 
                                    value={formData.city}
                                    onChange={e => updateField('city', e.target.value)}
                                />
                             </div>
                         </div>
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

                             {/* Instagram (Ownership Proof) */}
                             {!formData.instagram ? (
                                <button 
                                    onClick={() => handleConnectInstagram(false)}
                                    disabled={isInstagramConnecting}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-pink-500 bg-white transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                            <Instagram className="w-4 h-4 text-pink-500" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-[#1E0E62]">Instagram</div>
                                            <div className="text-[10px] text-gray-500">{isAspiring ? t('signup.instagram.verifyIdea') : t('signup.instagram.verifyOwnership')}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-pink-600">{isInstagramConnecting ? t('signup.instagram.connecting') : t('common.connect')}</span>
                                </button>
                             ) : (
                                <div className="w-full flex items-center justify-between p-3 rounded-xl border border-green-200 bg-green-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <Instagram className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-[#1E0E62]">{formData.instagram}</div>
                                            <div className="text-[10px] text-green-700">{t('signup.instagram.verified')}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => updateField('instagram', '')} className="p-1 text-gray-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                             )}
                         </div>

                         <div className="space-y-2 pt-2">
                            <label className="flex items-start gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isAuthorized} 
                                    onChange={e => updateField('isAuthorized', e.target.checked)}
                                    className="mt-1 w-4 h-4 text-[#F72585] rounded border-gray-300 focus:ring-[#F72585]" 
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
                    onClick={handleSubmit} 
                    disabled={
                        isSubmitting ||
                        !formData.legalName || 
                        (!isAspiring && !formData.vatId) || 
                        !formData.instagram || 
                        !formData.isAuthorized || 
                        !formData.street
                    }
                    isLoading={isSubmitting}
                    className="w-full py-4 text-lg shadow-xl shadow-[#1E0E62]/20"
                >
                    {isSubmitting ? t('signup.submitting') : t('signup.submitForReview')}
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
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
              <ProgressBar />
              <div className="mt-4 mb-6">
                  <button onClick={prevStep} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-4 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <div className="text-xs font-bold text-[#F72585] uppercase tracking-wider mb-1">{t('signup.stepOf', { current: 3, total: 4 })}</div>
                  <h1 className="text-2xl font-clash font-bold text-[#1E0E62] mb-1">{headerTitle}</h1>
                  <p className="text-[#8F8FA3] font-medium text-sm">{headerSub}</p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-8">
                  
                  {/* Section A: Personal Identity */}
                  <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <UserIcon className="w-4 h-4 text-[#8F8FA3]" />
                                     <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">{t('signup.creator.personalDetails')}</h3>
                         </div>
                         
                         <div className="flex gap-3">
                            <div className="flex-1">
                                <Input 
                                    label="First Name"
                                    placeholder="Enter your first name" 
                                    value={formData.firstName}
                                    onChange={e => updateField('firstName', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <Input 
                                    label="Last Name"
                                    placeholder="Enter your last name" 
                                    value={formData.lastName}
                                    onChange={e => updateField('lastName', e.target.value)}
                                />
                            </div>
                         </div>
                         
                         <div>
                            <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1 mb-2 block">Gender</label>
                            <select 
                                value={formData.gender}
                                onChange={(e) => updateField('gender', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white outline-none text-sm font-medium text-[#1E0E62] cursor-pointer"
                            >
                                <option value="">Select your gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                         </div>
                         
                         <div>
                            <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1 mb-2 block">Date of Birth</label>
                            <input 
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white outline-none font-medium text-[#1E0E62]"
                            />
                         </div>

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
                                     <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">{t('signup.creator.shippingAddress')}</h3>
                         </div>
                                 <p className="text-xs text-[#8F8FA3] -mt-3 mb-2">{t('signup.creator.shippingHint')}</p>
                         
                         <Input 
                                     label={t('signup.address.streetLabel')} 
                                     placeholder={t('signup.address.streetPlaceholder')} 
                            value={formData.street}
                            onChange={e => updateField('street', e.target.value)}
                         />
                         <div className="flex gap-4">
                             <div className="w-1/3">
                                <Input 
                                                label={t('signup.address.zipLabel')} 
                                                placeholder={t('signup.address.zipPlaceholder')} 
                                    value={formData.zipCode}
                                    onChange={e => updateField('zipCode', e.target.value)}
                                />
                             </div>
                             <div className="flex-1">
                                <Input 
                                                label={t('profile.city')} 
                                    value={formData.city}
                                    onChange={e => updateField('city', e.target.value)}
                                />
                             </div>
                         </div>
                  </div>

                  {/* Section C: Social Identity */}
                  <div className="bg-white p-5 rounded-[24px] border border-white shadow-sm space-y-4">
                         <div className="flex items-center gap-2 mb-1">
                            <Instagram className="w-4 h-4 text-[#8F8FA3]" />
                            <h3 className="text-sm font-bold text-[#1E0E62] uppercase tracking-wide">{t('signup.creator.socialIdentity')}</h3>
                         </div>
                         
                         {!formData.instagram ? (
                            <Button 
                                onClick={() => handleConnectInstagram(true)}
                                className="w-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 border-none"
                                disabled={isInstagramConnecting}
                            >
                                <Instagram className="w-4 h-4 mr-2" />
                                {isInstagramConnecting ? t('signup.instagram.connecting') : t('signup.creator.connectInstagram')}
                            </Button>
                         ) : (
                            <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-green-800">{t('signup.instagram.connected')}</div>
                                        <div className="text-sm font-bold text-[#1E0E62]">{formData.instagram}</div>
                                    </div>
                                </div>
                                <button onClick={() => { updateField('instagram', ''); updateField('handle', ''); }} className="p-2 hover:bg-white rounded-full">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                         )}
                         
                         <div className="mt-4">
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
                            className="mt-1 w-4 h-4 text-[#F72585] rounded border-gray-300 focus:ring-[#F72585]" 
                        />
                        <span className="text-xs font-medium text-[#1E0E62]">{t('signup.consent.agree')} <a href="#" className="text-blue-600 underline">{t('settings.termsOfService')}</a> {t('signup.consent.and')} <a href="#" className="text-blue-600 underline">{t('settings.privacyPolicy')}</a>.</span>
                    </label>
                  </div>
              </div>

              <Button 
                onClick={nextStep} 
                disabled={
                  !formData.firstName || 
                  !formData.lastName || 
                  !formData.phone || 
                  !formData.isAuthorized
                } 
                className="w-full py-4 text-lg mt-6 shadow-xl shadow-[#F72585]/30"
              >
                  {t('signup.nextStep')} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
          </div>
      );
  }

  // --- Step 4: Final Setup ---
  if (formData.step === 4) {
      const isBusiness = formData.role === 'BUSINESS' && !formData.isAspiringBusiness;
      const isAspiringBusiness = formData.role === 'BUSINESS' && formData.isAspiringBusiness;
      const isCustomer = formData.role === 'MEMBER';
      const isCreator = formData.role === 'CREATOR';
      
      // Active Business - Growth Goals
      const BUSINESS_GOALS = [
        { id: 'foot_traffic', label: 'More Foot Traffic', icon: '🚶', desc: 'Increase visitors to your location' },
        { id: 'social_growth', label: 'Social Media Growth', icon: '📈', desc: 'Gain followers and engagement' },
        { id: 'brand_awareness', label: 'Brand Awareness', icon: '📢', desc: 'Get known in your community' },
        { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐', desc: 'Build trust and credibility' },
        { id: 'ugc', label: 'User-Generated Content', icon: '📸', desc: 'Get photos, videos from customers' },
        { id: 'loyalty', label: 'Customer Loyalty', icon: '💝', desc: 'Build repeat customer base' },
        { id: 'collaborations', label: 'Creator Partnerships', icon: '🤝', desc: 'Work with influencers' },
        { id: 'events', label: 'Event Attendance', icon: '🎉', desc: 'Fill workshops and events' },
        { id: 'product_launch', label: 'Product Launch', icon: '🚀', desc: 'Launch new products/services' },
        { id: 'local_buzz', label: 'Word of Mouth', icon: '🔥', desc: 'Generate local buzz' },
        { id: 'email_list', label: 'Email List', icon: '📧', desc: 'Build your subscriber base' },
        { id: 'community', label: 'Community Building', icon: '👥', desc: 'Create loyal community' }
      ];

      // Aspiring Business - Learning & Launch Goals
      const ASPIRING_GOALS = [
        { id: 'market_research', label: 'Market Research', icon: '🔍', desc: 'Understand your target market' },
        { id: 'find_mentors', label: 'Find Mentors', icon: '🎓', desc: 'Learn from successful business owners' },
        { id: 'business_plan', label: 'Business Planning', icon: '📋', desc: 'Create a solid business plan' },
        { id: 'funding', label: 'Find Funding', icon: '💰', desc: 'Secure investment or loans' },
        { id: 'networking', label: 'Network Building', icon: '🤝', desc: 'Connect with other entrepreneurs' },
        { id: 'legal_setup', label: 'Legal Setup', icon: '⚖️', desc: 'Register and comply legally' },
        { id: 'branding', label: 'Brand Identity', icon: '🎨', desc: 'Create your brand and logo' },
        { id: 'location', label: 'Find Location', icon: '📍', desc: 'Scout the perfect spot' },
        { id: 'suppliers', label: 'Find Suppliers', icon: '📦', desc: 'Source products and materials' },
        { id: 'marketing', label: 'Marketing Strategy', icon: '📣', desc: 'Plan your launch marketing' },
        { id: 'skills', label: 'Learn Skills', icon: '💡', desc: 'Develop business skills' },
        { id: 'test_idea', label: 'Test Your Idea', icon: '🧪', desc: 'Validate your concept' }
      ];

      // Customer - Interests & Reward Preferences
      const CUSTOMER_INTERESTS = [
        { id: 'free_food', label: 'Free Food & Drinks', icon: '🍔', desc: 'Meals, snacks, coffee' },
        { id: 'discounts', label: 'Discounts & Deals', icon: '🏷️', desc: 'Save money on purchases' },
        { id: 'fashion', label: 'Fashion & Style', icon: '👕', desc: 'Clothes, shoes, accessories' },
        { id: 'beauty', label: 'Beauty & Wellness', icon: '💄', desc: 'Makeup, skincare, spa' },
        { id: 'fitness', label: 'Fitness & Sports', icon: '🏋️', desc: 'Gym, classes, equipment' },
        { id: 'tech', label: 'Tech & Gadgets', icon: '📱', desc: 'Electronics and apps' },
        { id: 'entertainment', label: 'Entertainment', icon: '🎬', desc: 'Movies, games, events' },
        { id: 'travel', label: 'Travel & Adventure', icon: '✈️', desc: 'Trips and experiences' },
        { id: 'home', label: 'Home & Lifestyle', icon: '🏠', desc: 'Decor, furniture, tools' },
        { id: 'experiences', label: 'Unique Experiences', icon: '🎟️', desc: 'Events, workshops, activities' },
        { id: 'gift_cards', label: 'Gift Cards', icon: '🎁', desc: 'Flexible rewards' },
        { id: 'exclusive', label: 'VIP Access', icon: '⭐', desc: 'Exclusive perks and early access' }
      ];

      // Creator - Content & Collaboration Interests
      const CREATOR_INTERESTS = [
        { id: 'brand_deals', label: 'Brand Collaborations', icon: '🤝', desc: 'Paid partnerships' },
        { id: 'free_products', label: 'Free Products', icon: '🎁', desc: 'Products to review' },
        { id: 'restaurant', label: 'Restaurant Content', icon: '🍽️', desc: 'Food and beverage' },
        { id: 'fashion', label: 'Fashion Content', icon: '👗', desc: 'Clothing and style' },
        { id: 'beauty', label: 'Beauty Content', icon: '💅', desc: 'Makeup and skincare' },
        { id: 'fitness', label: 'Fitness Content', icon: '💪', desc: 'Health and wellness' },
        { id: 'lifestyle', label: 'Lifestyle Content', icon: '✨', desc: 'Daily life and vlogs' },
        { id: 'travel', label: 'Travel Content', icon: '🌍', desc: 'Places and experiences' },
        { id: 'tech', label: 'Tech Reviews', icon: '📱', desc: 'Gadgets and apps' },
        { id: 'events', label: 'Event Coverage', icon: '🎉', desc: 'Parties and openings' },
        { id: 'local', label: 'Local Businesses', icon: '🏪', desc: 'Support local spots' },
        { id: 'portfolio', label: 'Build Portfolio', icon: '📸', desc: 'Grow your content library' }
      ];
      
      // Get the right list based on role
      const getInterestList = () => {
        if (isBusiness) return BUSINESS_GOALS;
        if (isAspiringBusiness) return ASPIRING_GOALS;
        if (isCustomer) return CUSTOMER_INTERESTS;
        if (isCreator) return CREATOR_INTERESTS;
        return [];
      };

      const getTitle = () => {
        if (isBusiness) return "What Are Your Business Goals?";
        if (isAspiringBusiness) return "What Do You Need to Launch?";
        if (isCustomer) return "What Interests You?";
        if (isCreator) return "What Content Do You Create?";
        return "Your Preferences";
      };

      const getSubtitle = () => {
        if (isBusiness) return "Select at least 3 goals so we can match you with the right customers and strategies";
        if (isAspiringBusiness) return "Select areas where you need help to get personalized guidance and connect with mentors";
        if (isCustomer) return "Select at least 3 interests so we can show you the best missions and rewards";
        if (isCreator) return "Select your content focus areas to get matched with relevant brand collaborations";
        return "Tell us your preferences";
      };

      const interests = getInterestList();
      
      return (
          <div className="min-h-screen bg-[#F8F9FE] flex flex-col p-6 animate-in slide-in-from-right duration-300 pt-10">
              <ProgressBar />
              <div className="mt-4 mb-6">
                  <button onClick={prevStep} className="text-gray-400 hover:text-[#1E0E62] font-bold text-sm mb-6 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <div className="text-xs font-bold text-[#F72585] uppercase tracking-wider mb-1">{t('signup.stepOf', { current: 4, total: 4 })}</div>
                  <h1 className="text-3xl font-clash font-bold text-[#1E0E62] mb-2">
                    {getTitle()}
                  </h1>
                  <p className="text-[#8F8FA3] font-medium">
                    {getSubtitle()}
                  </p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-4">
                  {/* Interest Selection */}
                  <div>
                          <h3 className="font-bold text-[#1E0E62] mb-1">
                            {isBusiness && "Select your top goals:"}
                            {isAspiringBusiness && "What help do you need?"}
                            {isCustomer && "What interests you?"}
                            {isCreator && "Your content focus:"}
                          </h3>
                          <p className="text-xs text-[#8F8FA3] mb-4">
                            {isBusiness && "Choose at least 3 goals to help us match you with the right strategies"}
                            {isAspiringBusiness && "Select areas where you need guidance (choose at least 3)"}
                            {isCustomer && "Choose at least 3 so we can show you relevant missions and rewards"}
                            {isCreator && "Pick at least 3 content types to get matched with brands"}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                              {interests.map(interest => {
                                  const active = formData.vibes.includes(interest.id);
                                  return (
                                      <button
                                        key={interest.id}
                                        onClick={() => toggleVibe(interest.id)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left ${
                                            active 
                                            ? 'border-[#F72585] bg-gradient-to-br from-pink-50 to-purple-50 shadow-md' 
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                      >
                                          <div className="text-3xl mb-2">{interest.icon}</div>
                                          <div className={`text-sm font-bold mb-1 ${active ? 'text-[#F72585]' : 'text-[#1E0E62]'}`}>
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
                                      {formData.vibes.length >= 3 ? '✓' : '•'} {formData.vibes.length} selected
                                      {formData.vibes.length < 3 && ` (${3 - formData.vibes.length} more needed)`}
                                  </div>
                              </div>
                          )}
                      </div>
                  
                  {/* Business Mode Selection - Only for Active Businesses */}
                  {isBusiness && (
                      <div>
                          <h3 className="font-bold text-[#1E0E62] mb-2">How do customers interact with you?</h3>
                          <p className="text-xs text-[#8F8FA3] mb-3">Choose your business model</p>
                          <div className="grid grid-cols-3 gap-3">
                              <button
                                  type="button"
                                  onClick={() => updateField('businessMode', 'PHYSICAL')}
                                  className={`p-4 rounded-2xl border-2 transition-all ${
                                      formData.businessMode === 'PHYSICAL'
                                          ? 'border-[#F72585] bg-pink-50'
                                          : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                              >
                                  <div className="text-2xl mb-2">🏪</div>
                                  <div className="text-xs font-bold text-[#1E0E62]">Physical Location</div>
                                  <div className="text-[10px] text-gray-500">Store/restaurant</div>
                              </button>
                              <button
                                  type="button"
                                  onClick={() => updateField('businessMode', 'ONLINE')}
                                  className={`p-4 rounded-2xl border-2 transition-all ${
                                      formData.businessMode === 'ONLINE'
                                          ? 'border-[#F72585] bg-pink-50'
                                          : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                              >
                                  <div className="text-2xl mb-2">💻</div>
                                  <div className="text-xs font-bold text-[#1E0E62]">Online Only</div>
                                  <div className="text-[10px] text-gray-500">E-commerce</div>
                              </button>
                              <button
                                  type="button"
                                  onClick={() => updateField('businessMode', 'HYBRID')}
                                  className={`p-4 rounded-2xl border-2 transition-all ${
                                      formData.businessMode === 'HYBRID'
                                          ? 'border-[#F72585] bg-pink-50'
                                          : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                              >
                                  <div className="text-2xl mb-2">🌐</div>
                                  <div className="text-xs font-bold text-[#1E0E62]">Both</div>
                                  <div className="text-[10px] text-gray-500">Physical + Online</div>
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mt-4">
                      {submitError}
                  </div>
              )}

              <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || formData.vibes.length < 3}
                  isLoading={isSubmitting}
                  className="w-full py-4 text-lg mt-4 shadow-xl shadow-[#F72585]/30"
              >
                  {isSubmitting 
                    ? t('signup.submitting') 
                    : isCustomer 
                      ? formData.vibes.length >= 3 
                        ? `Start Earning Rewards! 🎉`
                        : `Select ${3 - formData.vibes.length} More to Continue`
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

  // Show interests screen for customers after sign-up
  if (showInterestsScreen) {
    return (
      <CustomerInterestsScreen
        onComplete={handleInterestsComplete}
        onSkip={handleSkipPreferences}
      />
    );
  }

  // Show goals screen for businesses after sign-up
  if (showGoalsScreen) {
    return (
      <BusinessGoalsScreen
        onComplete={handleGoalsComplete}
        onSkip={handleSkipPreferences}
      />
    );
  }

  return null;
};