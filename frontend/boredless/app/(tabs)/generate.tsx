import { useState, useCallback, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { AntDesign, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useBottomSheet } from '../context/BottomSheetContext';
import { useGenerateContext } from './_layout';
import { useBottomSheetVisibility } from './_layout';
import { Card, CardResponse } from '../types/card';
import { 
  FILTER_OPTIONS, 
  InteractionType, 
  ConversationTheme, 
  Mood, 
  Participants, 
  Relationship,
  mapInteractionToCardType
} from '../constants/cardTypes';
import { mapApiResponseToCards, FilterParams } from '../utils/cardUtils';
import { useFontLoader } from '../hooks/useFontLoader';

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

      // Use the utility function to map the response
      const filters: FilterParams = {
        theme: selectedTheme,
        interaction_type: selectedInteraction,
        mood: selectedMood,
        participants: selectedParticipants,
        relationship: selectedRelationship
      };
      
      const result = mapApiResponseToCards(response.data, filters);
      
      if (result.cards && result.cards.length > 0) {
        console.log('Processed cards, total:', result.cards.length);
      } else {
        console.log('No cards found in the response');
      }
      
      return result;
    } catch (err) {
      console.error('Error generating prompt:', err);
      Alert.alert('Error', 'Failed to generate prompt. Please try again.');
      return null;
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

  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

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