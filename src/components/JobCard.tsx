import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Briefcase, Coins, MapPin, Clock, Code, Palette, 
  Megaphone, PenTool, Users, Wrench, FileText, Camera, Video, Music, 
  Languages, Headphones, ShoppingCart, Search, BarChart3, Shield, Car, 
  Home, Utensils, GraduationCap, Dumbbell, Heart, Baby, Dog, Hammer, 
  Zap, Paintbrush, Truck, BookOpen, Calculator, Globe, Lock, Lightbulb, 
  Target, Smartphone
} from 'lucide-react-native';
import { Job } from '../services/jobService';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  showStatus?: boolean;
}

export default function JobCard({ job, onPress, showStatus = false }: JobCardProps) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (job.status) {
      case 'open':
        return '#00C9A7';
      case 'accepted':
      case 'in-progress':
        return '#FFB800';
      case 'submitted':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
      case 'disputed':
        return '#FF3B30';
      default:
        return '#999999';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { size: 16, color: theme.primary };
    
    switch (category.toLowerCase()) {
      // Technology & Development
      case 'development':
      case 'dev':
      case 'programming':
        return <Code {...iconProps} />;
      case 'design':
      case 'ui-ux':
      case 'web-design':
        return <Palette {...iconProps} />;
      case 'mobile-app':
        return <Smartphone {...iconProps} />;
      
      // Media & Creative
      case 'photography':
        return <Camera {...iconProps} />;
      case 'video':
        return <Video {...iconProps} />;
      case 'music':
        return <Music {...iconProps} />;
      case 'audio':
        return <Headphones {...iconProps} />;
      case 'animation':
        return <Zap {...iconProps} />;
      
      // Content & Communication
      case 'writing':
        return <PenTool {...iconProps} />;
      case 'translation':
        return <Languages {...iconProps} />;
      case 'content-creation':
        return <FileText {...iconProps} />;
      case 'social-media':
        return <Megaphone {...iconProps} />;
      case 'blogging':
        return <BookOpen {...iconProps} />;
      
      // Business & Marketing
      case 'marketing':
        return <BarChart3 {...iconProps} />;
      case 'sales':
        return <ShoppingCart {...iconProps} />;
      case 'consulting':
        return <Users {...iconProps} />;
      case 'data-analysis':
        return <BarChart3 {...iconProps} />;
      case 'research':
        return <Search {...iconProps} />;
      
      // Services & Maintenance
      case 'maintenance':
        return <Wrench {...iconProps} />;
      case 'cleaning':
        return <Home {...iconProps} />;
      case 'plumbing':
        return <Hammer {...iconProps} />;
      case 'electrical':
        return <Zap {...iconProps} />;
      case 'painting':
        return <Paintbrush {...iconProps} />;
      
      // Transportation & Delivery
      case 'delivery':
        return <Truck {...iconProps} />;
      case 'driving':
        return <Car {...iconProps} />;
      case 'logistics':
        return <Truck {...iconProps} />;
      
      // Personal Services
      case 'cooking':
        return <Utensils {...iconProps} />;
      case 'tutoring':
        return <GraduationCap {...iconProps} />;
      case 'fitness':
        return <Dumbbell {...iconProps} />;
      case 'beauty':
        return <Heart {...iconProps} />;
      case 'childcare':
        return <Baby {...iconProps} />;
      case 'pet-care':
        return <Dog {...iconProps} />;
      
      // Professional Services
      case 'accounting':
        return <Calculator {...iconProps} />;
      case 'legal':
        return <Shield {...iconProps} />;
      case 'security':
        return <Lock {...iconProps} />;
      case 'project-management':
        return <Target {...iconProps} />;
      
      // Default
      default:
        return <Briefcase {...iconProps} />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'draft':
        return 'Draft';
      case 'open':
        return 'Open';
      case 'offered':
        return 'Has Offers';
      case 'accepted':
        return 'Accepted';
      case 'in-progress':
        return 'In Progress';
      case 'submitted':
        return 'Submitted';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'disputed':
        return 'Disputed';
      default:
        return 'Unknown';
    }
  };

  const roundToProperCoinValue = (amount: number): number => {
    // Round to proper coin denominations: 5, 10, 50, 100, 200, 500 QR
    if (amount <= 5) return 5;
    if (amount <= 10) return 10;
    if (amount <= 50) return Math.ceil(amount / 5) * 5; // Round to nearest 5
    if (amount <= 100) return Math.ceil(amount / 10) * 10; // Round to nearest 10
    if (amount <= 200) return Math.ceil(amount / 50) * 50; // Round to nearest 50
    if (amount <= 500) return Math.ceil(amount / 100) * 100; // Round to nearest 100
    if (amount <= 1000) return Math.ceil(amount / 200) * 200; // Round to nearest 200
    if (amount <= 5000) return Math.ceil(amount / 500) * 500; // Round to nearest 500
    return Math.ceil(amount / 1000) * 1000; // Round to nearest 1000
  };

  const formatBudget = () => {
    if (typeof job.budget === 'string') {
      // Extract numbers from string and round them
      const numbers = job.budget.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const amount = parseInt(numbers[0]);
        const rounded = roundToProperCoinValue(amount);
        return `${rounded} QR`;
      }
      return job.budget.replace(/Coins/gi, 'QR');
    }
    const minRounded = roundToProperCoinValue(job.budget.min || 0);
    const maxRounded = roundToProperCoinValue(job.budget.max || 0);
    return `${minRounded}-${maxRounded} QR`;
  };

  const formatLocation = () => {
    if (typeof job.location === 'string') {
      return job.location;
    }
    return job.location.address;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.textPrimary, flex: 1 }]} numberOfLines={2}>
              {job.title}
            </Text>
            {job.category && (
              <View style={[styles.categoryIcon, { backgroundColor: theme.primary + '15' }]}>
                {getCategoryIcon(job.category)}
              </View>
            )}
          </View>
          {showStatus && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
        {job.description}
      </Text>

      {/* Details */}
      <View style={styles.detailsContainer}>
        {/* Budget */}
        <View style={styles.detailItem}>
          <Coins size={14} color="#00C9A7" />
          <Text style={[styles.detailText, { color: theme.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
            {formatBudget()}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.detailItem}>
          <MapPin size={14} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
            {formatLocation()}
          </Text>
        </View>

        {/* Time */}
        <View style={styles.detailItem}>
          <Clock size={14} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
            {job.timeNeeded}
          </Text>
        </View>
      </View>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <View style={styles.skills}>
          {(Array.isArray(job?.skills) ? job.skills : []).slice(0, 3).map((skill, index) => (
            <View
              key={`${job?.id || "job"}-skill-${index}`}
              style={[styles.skillTag, { backgroundColor: theme.primary + '15' }]}
            >
              <Text style={[styles.skillText, { color: theme.primary }]}>
                {String(skill)}
              </Text>
            </View>
          ))}
          {(Array.isArray(job?.skills) ? job.skills.length : 0) > 3 && (
            <Text style={[styles.moreSkills, { color: theme.textSecondary }]}>
              +{(Array.isArray(job?.skills) ? job.skills.length : 0) - 3}
            </Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.postedBy, { color: theme.textSecondary }]}>
          by {job.clientName || 'Anonymous'}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {new Date(job.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    position: 'relative',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  categoryIcon: {
    padding: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    flexShrink: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  skills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreSkills: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  postedBy: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
});







