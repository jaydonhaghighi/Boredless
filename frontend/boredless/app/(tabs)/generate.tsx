import { useState, useCallback, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { AntDesign, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useBottomSheet } from '../context/BottomSheetContext';
import { useGenerateContext } from './_layout';
import { useBottomSheetVisibility } from './_layout';
import { Card, CardResponse } from '../types/card';

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

// Remove the function to get the generated cards
// export const getGeneratedCards = () => {
//   return generatedCards;
// };

export default function GenerateScreen() {
  const router = useRouter();
  const { setGeneratePrompt } = useGenerateContext();
  const { showBottomSheet, setIsGenerating, isGenerating } = useBottomSheetVisibility();

  // Filter states
  const [selectedTheme, setSelectedTheme] = useState<ConversationTheme | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionType | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Participants | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  // Register our generate function with the context
  useEffect(() => {
    console.log('Setting up generatePrompt function');
    setGeneratePrompt(generatePrompt);
  }, [selectedTheme, selectedInteraction, selectedMood, selectedParticipants, selectedRelationship]);

  // Define the generate prompt function
  const generatePrompt = async (): Promise<CardResponse | null> => {
    console.log('Generating prompt with filters:', {
      theme: selectedTheme,
      interaction_type: selectedInteraction,
      mood: selectedMood,
      participants: selectedParticipants,
      relationship: selectedRelationship
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/generator/`, {
        theme: selectedTheme,
        interaction_type: selectedInteraction,
        mood: selectedMood,
        participants: selectedParticipants,
        relationship: selectedRelationship
      });

      console.log('API Response:', response.data);

      // Check if we have a cards array from the new API format
      if (response.data.cards && Array.isArray(response.data.cards) && response.data.cards.length > 0) {
        // Map all cards to our format
        const cards = response.data.cards.map((card: any) => {
          // Make sure we properly extract the followups array
          let followups = [];
          if (card.followups && Array.isArray(card.followups)) {
            followups = card.followups;
          }
          
          return {
            question: card.question || '',
            title: card.title || selectedInteraction || 'Prompt',
            followups: followups,
            theme: selectedTheme || undefined,
            interaction_type: selectedInteraction || undefined,
            mood: selectedMood || undefined,
            participants: selectedParticipants || undefined,
            relationship: selectedRelationship || undefined,
            card_type: card.card_type || (selectedInteraction ? mapInteractionToCardType(selectedInteraction) : undefined),
            instructions: card.instructions || undefined,
            options: card.options || undefined,
            stances: card.stances || undefined,
            action_prompt: card.action_prompt || undefined,
            correct_answer_index: card.correct_answer_index || undefined
          };
        });
        
        // Return the first card as required by the interface, but include all cards directly
        console.log('Returning mapped cards, total:', cards.length);
        
        // Include first card data + all cards array
        return {
          question: cards[0].question,
          title: cards[0].title,
          followups: cards[0].followups,
          theme: selectedTheme || undefined,
          interaction_type: selectedInteraction || undefined,
          mood: selectedMood || undefined,
          participants: selectedParticipants || undefined,
          relationship: selectedRelationship || undefined,
          card_type: cards[0].card_type,
          instructions: cards[0].instructions,
          options: cards[0].options,
          stances: cards[0].stances,
          action_prompt: cards[0].action_prompt,
          correct_answer_index: cards[0].correct_answer_index,
          cards: cards // Include all cards
        };
      } else {
        // Fallback for old format
        const card_type = selectedInteraction ? mapInteractionToCardType(selectedInteraction) : 'conversation_starter';
        
        // Make sure we properly extract the followups array
        let followups = [];
        if (response.data.followups && Array.isArray(response.data.followups)) {
          followups = response.data.followups;
        }
        
        const result = {
          question: response.data.question || '',
          title: response.data.title || selectedInteraction || 'Prompt',
          followups: followups,
          theme: selectedTheme || undefined,
          interaction_type: selectedInteraction || undefined,
          mood: selectedMood || undefined,
          participants: selectedParticipants || undefined,
          relationship: selectedRelationship || undefined,
          card_type: response.data.card_type || card_type,
          instructions: response.data.instructions || undefined,
          options: response.data.options || undefined,
          stances: response.data.stances || undefined,
          action_prompt: response.data.action_prompt || undefined,
          correct_answer_index: response.data.correct_answer_index || undefined
        };
        console.log('Returning fallback data:', result);
        
        // Include as a single card array
        return {
          ...result,
          cards: [result]
        };
      }
    } catch (err) {
      console.error('Error generating prompt:', err);
      Alert.alert('Error', 'Failed to generate prompt. Please try again.');
      return null;
    }
  };

  // Helper function to map interaction type to card type
  const mapInteractionToCardType = (interactionType: InteractionType): string => {
    switch(interactionType) {
      case "Conversation Starters":
        return "conversation_starter";
      case "Interactive Games":
        return "interactive_game";
      case "Quizzes":
        return "quiz";
      case "Friendly Debates":
        return "debate";
      case "Icebreakers":
        return "icebreaker";
      case "Thought-provoking Questions":
        return "thought_provoking";
      default:
        return "conversation_starter";
    }
  };

  // Open the bottom sheet and immediately generate the prompt when the Generate button is pressed
  const applyFilters = async () => {
    setIsGenerating(true);
    showBottomSheet();
    
    try {
      // We're calling generatePrompt directly here instead of in the bottom sheet
      console.log('Generating prompt with filters...');
      const result = await generatePrompt();
      
      if (!result) {
        console.error('Failed to generate prompt');
        Alert.alert('Error', 'Failed to generate prompt. Please try again.');
        setIsGenerating(false); // Only set to false here if there's no result
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      Alert.alert('Error', 'Failed to generate prompt. Please try again.');
      setIsGenerating(false); // Only set to false here if there's an error
    }
    // We don't set isGenerating to false on success - that will be handled in the bottom sheet component
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
              style={[styles.generateButton, isGenerating && styles.disabledButton]}
              onPress={applyFilters}
              disabled={isGenerating}
            >
              {isGenerating ? (
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
            disabled={isGenerating}
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