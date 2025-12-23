import { useTranslation } from 'react-i18next';

/**
 * Custom hook that provides commonly used translations
 * This reduces repetition across components
 */
export const useTranslations = () => {
  const { t, i18n } = useTranslation();

  return {
    t,
    i18n,
    common: {
      loading: t('common.loading'),
      error: t('common.error'),
      success: t('common.success'),
      save: t('common.save'),
      cancel: t('common.cancel'),
      delete: t('common.delete'),
      edit: t('common.edit'),
      close: t('common.close'),
      back: t('common.back'),
      next: t('common.next'),
      submit: t('common.submit'),
      search: t('common.search'),
    },
    navigation: {
      home: t('navigation.home'),
      explore: t('navigation.explore'),
      missions: t('navigation.missions'),
      meetups: t('navigation.meetups'),
      profile: t('navigation.profile'),
      settings: t('navigation.settings'),
      notifications: t('navigation.notifications'),
      messages: t('navigation.messages'),
      inbox: t('navigation.inbox'),
    }
  };
};
