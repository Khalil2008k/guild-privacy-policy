import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useI18n } from '@/contexts/I18nProvider';

interface Job {
  id: string;
  title: string;
  price: number;
  timeNeeded: string;
  location: string;
  posterName: string;
  posterAvatar: string;
  trustScore: number;
  isUrgent?: boolean;
  guildLevel?: number;
  category: string;
  level?: string;
  jobClass?: string;
}

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const { t } = useI18n();
  const {
    title,
    price,
    timeNeeded,
    location,
    posterName,
    posterAvatar,
    trustScore,
    isUrgent = false,
    guildLevel,
    category,
  } = job;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.glowEffect} />
      
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        {isUrgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash-outline" size={10} color="#F9CB40" fill="#F9CB40" />
            <Text style={styles.urgentText}>{t('urgent')}</Text>
          </View>
        )}
        {guildLevel && (
          <View style={styles.guildBadge}>
            <MaterialIcons name="security" size={10} color="#8A6DF1" fill="#8A6DF1" />
            <Text style={styles.guildText}>LV.{guildLevel}+</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.details}>
        <View style={styles.priceTime}>
          <Text style={styles.price}>QR {price?.toLocaleString() || '0'}</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color="#A4B1C0" />
            <Text style={styles.time}>{timeNeeded}</Text>
          </View>
        </View>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={12} color="#A4B1C0" />
          <Text style={styles.location}>{location}</Text>
        </View>
      </View>
      
      <View style={styles.poster}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => {
            // TODO: Navigate to poster's profile
            console.log(`Navigate to ${posterName}'s profile`);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" source={{ uri: posterAvatar }} style={styles.avatar} />
          <View style={styles.avatarGlow} />
        </TouchableOpacity>
        <View style={styles.posterInfo}>
          <Text style={styles.posterName}>{posterName}</Text>
          <View style={styles.trustContainer}>
            <Ionicons name="star-outline" size={10} color="#F9CB40" fill="#F9CB40" />
            <Text style={styles.trustScore}>
              {trustScore ? trustScore.toFixed(1) : '0.0'} Trust Rating
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.buttonGlow} />
          <Text style={styles.applyText}>APPLY</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A2136',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#23D5AB15',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#23D5AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#23D5AB',
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#23D5AB20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#23D5AB40',
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#23D5AB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    backgroundColor: '#F9CB4020',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#F9CB4040',
  },
  urgentText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: '#F9CB40',
    letterSpacing: 0.5,
  },
  guildBadge: {
    backgroundColor: '#8A6DF120',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#8A6DF140',
  },
  guildText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: '#8A6DF1',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 24,
  },
  details: {
    marginBottom: 20,
  },
  priceTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#23D5AB',
    textShadow: '0 0 8px #23D5AB40',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0A0F2420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  time: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#A4B1C0',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#A4B1C0',
  },
  poster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#23D5AB40',
  },
  avatarGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#23D5AB20',
  },
  posterInfo: {
    flex: 1,
  },
  posterName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trustContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustScore: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#A4B1C0',
  },
  applyButton: {
    backgroundColor: '#23D5AB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#23D5AB',
    opacity: 0.2,
    borderRadius: 20,
  },
  applyText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#0A0F24',
    letterSpacing: 1,
  },
});
