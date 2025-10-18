import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function FilterBar() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');

  const categories = ['All Categories', 'Data Analysis', 'Web Development', 'Design', 'Delivery', 'Cleaning'];
  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Expert'];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // Cycle through categories
            const currentIndex = categories.indexOf(selectedCategory);
            const nextIndex = (currentIndex + 1) % categories.length;
            setSelectedCategory(categories[nextIndex]);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.filterText}>{selectedCategory}</Text>
          <Ionicons name="chevron-down" size={14} color="#23D5AB" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // TODO: Implement proximity filter
            console.log('Proximity filter pressed');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={14} color="#23D5AB" />
          <Text style={styles.filterText}>Proximity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // Cycle through levels
            const currentIndex = levels.indexOf(selectedLevel);
            const nextIndex = (currentIndex + 1) % levels.length;
            setSelectedLevel(levels[nextIndex]);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="flash-outline" size={14} color="#23D5AB" />
          <Text style={styles.filterText}>{selectedLevel}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // TODO: Implement rating filter
            console.log('Rating filter pressed');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="star-outline" size={14} color="#23D5AB" />
          <Text style={styles.filterText}>Rating</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // TODO: Implement price range filter
            console.log('Price range filter pressed');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.filterText}>Price Range</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // TODO: Implement urgency filter
            console.log('Urgency filter pressed');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.filterText}>Urgency</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.moreFilters}
          onPress={() => {
            // TODO: Open more filters modal
            console.log('More filters pressed');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="filter-outline" size={16} color="#23D5AB" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A2136',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#23D5AB20',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23D5AB15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#23D5AB30',
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#23D5AB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreFilters: {
    backgroundColor: '#23D5AB20',
    padding: 10,
    borderRadius: 20,
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: '#23D5AB40',
  },
});
