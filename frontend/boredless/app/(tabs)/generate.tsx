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
  CARD_TYPES,
  CardTypeName, 
  Topic, 
  Tone, 
  Participants, 
  Relationship,
  mapCardTypeToId
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
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<CardTypeName | null>(null);
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Participants | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  // Update filter options when card type changes
  useEffect(() => {
    // Reset all filter values when card type changes
    setSelectedTopic(null);
    setSelectedTone(null);
    setSelectedParticipants(null);
    setSelectedRelationship(null);
  }, [selectedCardType]);

  // Update relationship based on participant count
  useEffect(() => {
    if (selectedParticipants === "Solo") {
      setSelectedRelationship("Self");
    } else if (selectedRelationship === "Self") {
      // Reset relationship if it was "Self" and participant count is no longer "Solo"
      setSelectedRelationship(null);
    }
  }, [selectedParticipants]);

  // Register our generate function with the context
  useEffect(() => {
    console.log('Setting up generatePrompt function');
    setGeneratePrompt(generatePrompt);
  }, [selectedTopic, selectedCardType, selectedTone, selectedParticipants, selectedRelationship]);

  // Define the generate prompt function
  const generatePrompt = async (): Promise<CardResponse | null> => {
    // Ensure card type is selected before allowing generation
    if (!selectedCardType) {
      Alert.alert('Card Type Required', 'Please select a card type before generating prompts.');
      return null;
    }
    
    console.log('Generating prompt with filters:', {
      topic: selectedTopic,
      card_type: selectedCardType,
      tone: selectedTone,
      participants: selectedParticipants,
      relationship: selectedRelationship
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/generator/`, {
        topic: selectedTopic,
        card_type: selectedCardType,
        tone: selectedTone,
        participants: selectedParticipants,
        relationship: selectedRelationship
      });

      console.log('API Response:', response.data);

      // Use the utility function to map the response
      const filters: FilterParams = {
        topic: selectedTopic,
        card_type: selectedCardType,
        tone: selectedTone,
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
    // Ensure card type is selected
    if (!selectedCardType) {
      Alert.alert('Card Type Required', 'Please select a card type before generating prompts.');
      return;
    }
    
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
    setSelectedTopic(null);
    setSelectedCardType(null);
    setSelectedTone(null);
    setSelectedParticipants(null);
    setSelectedRelationship(null);
  };

  const { fontsLoaded, fontError, onLayoutRootView } = useFontLoader();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Get only the filter options that are recommended for the selected card type
  const getTopics = (): Topic[] => {
    if (!selectedCardType) return [];
    return [...CARD_TYPES[selectedCardType].topics];
  };

  const getTones = (): Tone[] => {
    if (!selectedCardType) return [];
    return [...CARD_TYPES[selectedCardType].tones];
  };

  const getParticipants = (): Participants[] => {
    if (!selectedCardType) return [];
    return [...CARD_TYPES[selectedCardType].participants];
  };

  const getRelationships = (): Relationship[] => {
    if (!selectedCardType) return [];
    
    // If "Solo" is selected as the participant count, only show "Self" as relationship option
    if (selectedParticipants === "Solo") {
      return ["Self"];
    }
    
    // Filter out "Self" from relationships when participant count is not "Solo"
    return [...CARD_TYPES[selectedCardType].relationships].filter(rel => rel !== "Self");
  };

  // Check if other filters should be shown (only if card type is selected)
  const shouldShowFilters = selectedCardType !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']} onLayout={onLayoutRootView}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Prompt Generator</Text>
            <Text style={styles.subtitle}>
              Start by selecting a card type, then customize with filters
            </Text>
          </View>

          {/* Card Type Selection - Always Visible */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Card Type (Required)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {FILTER_OPTIONS.cardTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterButton, selectedCardType === type && styles.selectedFilterButton]}
                  onPress={() => {
                    // If user clicks the currently selected card type, deselect it
                    if (selectedCardType === type) {
                      setSelectedCardType(null);
                    } else {
                      // If user selects a different card type, update it
                      // (filters will be reset by the useEffect)
                      setSelectedCardType(type);
                    }
                  }}
                >
                  <Text style={[styles.filterButtonText, selectedCardType === type && styles.selectedFilterButtonText]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Only show additional filters if a card type is selected */}
          {shouldShowFilters && (
            <>
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Topic</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {getTopics().map((topic) => (
                    <TouchableOpacity
                      key={topic}
                      style={[styles.filterButton, selectedTopic === topic && styles.selectedFilterButton]}
                      onPress={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                    >
                      <Text style={[styles.filterButtonText, selectedTopic === topic && styles.selectedFilterButtonText]}>
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Tone</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {getTones().map((tone) => (
                    <TouchableOpacity
                      key={tone}
                      style={[styles.filterButton, selectedTone === tone && styles.selectedFilterButton]}
                      onPress={() => setSelectedTone(selectedTone === tone ? null : tone)}
                    >
                      <Text style={[styles.filterButtonText, selectedTone === tone && styles.selectedFilterButtonText]}>
                        {tone}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Participants</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {getParticipants().map((count) => (
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
                  {getRelationships().map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.filterButton, 
                        selectedRelationship === rel && styles.selectedFilterButton,
                        selectedParticipants === "Solo" && styles.disabledButton
                      ]}
                      onPress={() => {
                        if (selectedParticipants !== "Solo") {
                          setSelectedRelationship(selectedRelationship === rel ? null : rel);
                        }
                      }}
                      disabled={selectedParticipants === "Solo"}
                    >
                      <Text style={[
                        styles.filterButtonText, 
                        selectedRelationship === rel && styles.selectedFilterButtonText
                      ]}>
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {selectedParticipants === "Solo" && (
                  <Text style={styles.helperText}>
                    When Solo is selected, relationship is set to Self
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Message when no card type is selected */}
          {!shouldShowFilters && (
            <View style={styles.noCardTypeContainer}>
              <Text style={styles.noCardTypeText}>
                Please select a card type above to see recommended filters
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.generateButton, 
                isGenerating && styles.disabledButton,
                !selectedCardType && styles.disabledButton
              ]}
              onPress={applyFilters}
              disabled={isGenerating || !selectedCardType}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.generateButtonText}>Create Deck</Text>
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
    opacity: 0.5,
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
  noCardTypeContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  noCardTypeText: {
    color: '#5F5F5F',
    fontSize: 14,
    textAlign: 'center',
  },
  helperText: {
    color: '#5F5F5F',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});