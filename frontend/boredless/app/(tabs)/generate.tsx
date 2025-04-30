import { useState, useCallback, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { AntDesign, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Define filter options and their types
const FILTER_OPTIONS = {
  themes: [
    "Casual Chat",
    "Fun & Games",
    "Career & Goals",
    "Relationships & Dating",
    "Family & Home",
    "Personality & Self-discovery",
    "Debates & Opinions",
    "Learning & Education",
    "Pop Culture & Entertainment",
    "Philosophy & Big Questions",
    "Creativity & Imagination"
  ] as const,

  interactionTypes: [
    "Conversation Starters",
    "Interactive Games",
    "Quizzes",
    "Friendly Debates",
    "Icebreakers",
    "Thought-provoking Questions"
  ] as const,

  moods: [
    "Romantic",
    "Playful",
    "Friendly",
    "Thoughtful",
    "Reflective",
    "Energetic",
    "Serious",
    "Calm",
    "Humourous",
    "Adventurous"
  ] as const,

  participants: [
    "Solo",
    "2",
    "3-5",
    "6+"
  ] as const,

  relationships: [
    "Strangers",
    "Aquaintances",
    "Friends",
    "Close Friends",
    "Family",
    "Romantic Partners",
    "Coworkers",
    "Mixed Group"
  ] as const
};

// Define types based on the options
type ConversationTheme = typeof FILTER_OPTIONS.themes[number];
type InteractionType = typeof FILTER_OPTIONS.interactionTypes[number];
type Mood = typeof FILTER_OPTIONS.moods[number];
type Participants = typeof FILTER_OPTIONS.participants[number];
type Relationship = typeof FILTER_OPTIONS.relationships[number];

// API base URL - replace with your actual backend URL
const API_BASE_URL = 'http://localhost:8000';

export default function GenerateScreen() {
  const router = useRouter();

  // Filter states
  const [selectedTheme, setSelectedTheme] = useState<ConversationTheme | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionType | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Participants | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generatePrompt = async () => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/generator/`, {
        theme: selectedTheme,
        interaction_type: selectedInteraction,
        mood: selectedMood,
        participants: selectedParticipants,
        relationship: selectedRelationship
      });

      // Check if we have a cards array from the new API format
      if (response.data.cards && Array.isArray(response.data.cards) && response.data.cards.length > 0) {
        // Take the first card from the array
        const card = response.data.cards[0];
        
        // Navigate to the prompt screen with all parameters
        router.push({
          pathname: '/prompt',
          params: {
            // Pass the cards data as JSON
            cards: JSON.stringify(response.data.cards),
            // Pass the first card's data directly
            prompt: card.question || '',
            title: card.title || selectedInteraction || 'Prompt',
            followups: JSON.stringify(card.followups || []),
            instructions: card.instructions || '',
            options: JSON.stringify(card.options || []),
            stances: JSON.stringify(card.stances || []),
            // Also pass the original filter parameters
            theme: selectedTheme,
            interaction_type: selectedInteraction,
            mood: selectedMood,
            participants: selectedParticipants,
            relationship: selectedRelationship
          }
        });
      } else {
        // Fallback for old format
      router.push({
        pathname: '/prompt',
        params: {
            prompt: response.data.question || '',
            title: response.data.title || selectedInteraction || 'Prompt',
            followups: JSON.stringify(response.data.followups || []),
            theme: selectedTheme,
            interaction_type: selectedInteraction,
            mood: selectedMood,
            participants: selectedParticipants,
            relationship: selectedRelationship
        }
      });
      }
    } catch (err) {
      console.error('Error generating prompt:', err);
      Alert.alert('Error', 'Failed to generate prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Generate prompt with selected filters
    generatePrompt();
  };

  const resetFilters = () => {
    setSelectedTheme(null);
    setSelectedInteraction(null);
    setSelectedMood(null);
    setSelectedParticipants(null);
    setSelectedRelationship(null);
  };

  const [fontsLoaded, fontError] = useFonts({
    'Petrona-Bold': require('../../assets/fonts/Petrona-Bold.ttf'),
    'Petrona-Regular': require('../../assets/fonts/Petrona-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Prompt Generator</Text>
            <Text style={styles.subtitle}>
              Find the perfect conversation prompt by customizing your filters
            </Text>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Theme</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {FILTER_OPTIONS.themes.map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[styles.filterButton, selectedTheme === theme && styles.selectedFilterButton]}
                  onPress={() => setSelectedTheme(selectedTheme === theme ? null : theme)}
                >
                  <Text style={[styles.filterButtonText, selectedTheme === theme && styles.selectedFilterButtonText]}>
                    {theme}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Interaction Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {FILTER_OPTIONS.interactionTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterButton, selectedInteraction === type && styles.selectedFilterButton]}
                  onPress={() => setSelectedInteraction(selectedInteraction === type ? null : type)}
                >
                  <Text style={[styles.filterButtonText, selectedInteraction === type && styles.selectedFilterButtonText]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {FILTER_OPTIONS.moods.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[styles.filterButton, selectedMood === mood && styles.selectedFilterButton]}
                  onPress={() => setSelectedMood(selectedMood === mood ? null : mood)}
                >
                  <Text style={[styles.filterButtonText, selectedMood === mood && styles.selectedFilterButtonText]}>
                    {mood}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Participants</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {FILTER_OPTIONS.participants.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[styles.filterButton, selectedParticipants === count && styles.selectedFilterButton]}
                  onPress={() => setSelectedParticipants(selectedParticipants === count ? null : count)}
                >
                  <Text style={[styles.filterButtonText, selectedParticipants === count && styles.selectedFilterButtonText]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Relationship</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {FILTER_OPTIONS.relationships.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.filterButton, selectedRelationship === rel && styles.selectedFilterButton]}
                  onPress={() => setSelectedRelationship(selectedRelationship === rel ? null : rel)}
                >
                  <Text style={[styles.filterButtonText, selectedRelationship === rel && styles.selectedFilterButtonText]}>
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.generateButton, isLoading && styles.disabledButton]}
              onPress={applyFilters}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.generateButtonText}>Generate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetFilters}
            disabled={isLoading}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  promptContainer: {
    marginVertical: 24,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },
  promptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
  },
  disabledButton: {
    opacity: 0.7,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5F5F5F',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5F5F5F',
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
    marginHorizontal: -32,
    paddingHorizontal: 32,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: '#FFFFFF',
  },
  selectedFilterButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#000000',
  },
  selectedFilterButtonText: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  resetButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#5F5F5F',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});