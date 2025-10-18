import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nProvider';
import { useAccessibility } from '../contexts/AccessibilityContext';
import AccessibleButton from './AccessibleButton';

export type ErrorType = 
  | 'network'
  | 'server'
  | 'permission'
  | 'notFound'
  | 'authentication'
  | 'validation'
  | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  actions?: Array<{
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  showDetails?: boolean;
}

const errorConfigs: Record<ErrorType, {
  icon: keyof typeof Ionicons.glyphMap;
  defaultTitle: string;
  defaultMessage: string;
  color: string;
}> = {
  network: {
    icon: 'wifi-off',
    defaultTitle: 'noConnection',
    defaultMessage: 'checkInternetConnection',
    color: '#FF9500',
  },
  server: {
    icon: 'server',
    defaultTitle: 'serverError',
    defaultMessage: 'serverErrorMessage',
    color: '#FF3B30',
  },
  permission: {
    icon: 'lock-closed',
    defaultTitle: 'permissionDenied',
    defaultMessage: 'permissionDeniedMessage',
    color: '#FF9500',
  },
  notFound: {
    icon: 'search',
    defaultTitle: 'notFound',
    defaultMessage: 'notFoundMessage',
    color: '#8E8E93',
  },
  authentication: {
    icon: 'person-circle',
    defaultTitle: 'authenticationError',
    defaultMessage: 'authenticationErrorMessage',
    color: '#FF3B30',
  },
  validation: {
    icon: 'alert-circle',
    defaultTitle: 'validationError',
    defaultMessage: 'validationErrorMessage',
    color: '#FF9500',
  },
  generic: {
    icon: 'warning',
    defaultTitle: 'somethingWentWrong',
    defaultMessage: 'genericErrorMessage',
    color: '#FF3B30',
  },
};

/**
 * Comprehensive error state component with accessibility
 * Provides context-specific error messages and recovery actions
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  message,
  details,
  onRetry,
  onGoBack,
  actions = [],
  showDetails = __DEV__,
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { announce } = useAccessibility();
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const config = errorConfigs[type];

  // Announce error to screen readers
  React.useEffect(() => {
    const errorMessage = `${t('error')}: ${title || t(config.defaultTitle)}. ${
      message || t(config.defaultMessage)
    }`;
    announce(errorMessage, { queue: false });
  }, [type, title, message]);

  const renderIcon = () => {
    const IconComponent = type === 'server' ? MaterialIcons : Ionicons;
    return (
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: config.color + '20' },
        ]}
      >
        <IconComponent
          name={config.icon as any}
          size={48}
          color={config.color}
        />
      </View>
    );
  };

  const renderActions = () => {
    const buttons = [...actions];

    if (onRetry) {
      buttons.unshift({
        label: t('retry'),
        onPress: onRetry,
        variant: 'primary',
      });
    }

    if (onGoBack) {
      buttons.push({
        label: t('goBack'),
        onPress: onGoBack,
        variant: 'secondary',
      });
    }

    if (buttons.length === 0) return null;

    return (
      <View style={styles.actionsContainer}>
        {buttons.map((action, index) => (
          <AccessibleButton
            key={index}
            label={action.label}
            hint={t('tapToPerformAction')}
            onPress={action.onPress}
            variant={action.variant || 'secondary'}
            style={styles.actionButton}
          >
            {action.label}
          </AccessibleButton>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      accessible={true}
      accessibilityRole="alert"
    >
      <View style={styles.content}>
        {renderIcon()}

        <Text
          style={[styles.title, { color: theme.text }]}
          accessible={true}
          accessibilityRole="header"
        >
          {title || t(config.defaultTitle)}
        </Text>

        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {message || t(config.defaultMessage)}
        </Text>

        {showDetails && details && (
          <TouchableOpacity
            onPress={() => setDetailsExpanded(!detailsExpanded)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('errorDetails')}
            accessibilityHint={
              detailsExpanded ? t('tapToHideDetails') : t('tapToShowDetails')
            }
            style={styles.detailsToggle}
          >
            <Text style={[styles.detailsToggleText, { color: theme.primary }]}>
              {detailsExpanded ? t('hideDetails') : t('showDetails')}
            </Text>
            <Ionicons
              name={detailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}

        {detailsExpanded && details && (
          <View
            style={[
              styles.detailsContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
              {details}
            </Text>
          </View>
        )}

        {renderActions()}

        {/* Help text for common errors */}
        {type === 'network' && (
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            {t('networkErrorHelp')}
          </Text>
        )}

        {type === 'permission' && (
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            {t('permissionErrorHelp')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    minWidth: 120,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  detailsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  detailsContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  detailsText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
    paddingHorizontal: 24,
  },
});

export default ErrorState;

