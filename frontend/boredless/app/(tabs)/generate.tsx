import { useState, useCallback, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentGeneration } from '../../context/TabContext';
import { useBottomSheetVisibility } from '../../context/TabContext';
import { 
  FILTER_OPTIONS, 
  CARD_TYPES,
  CardTypeName, 
  Topic, 
  Tone, 
  Participants, 
  Relationship,
} from '../../constants/cardTypes';
import { useFontLoader } from '../../hooks/useFontLoader';
import { FilterParams } from "../../utils/cardUtils";

export default function GenerateScreen() {
  const { triggerCardGeneration, generationState } = useCurrentGeneration();
  const { showBottomSheet, setIsGeneratingSheetState } = useBottomSheetVisibility();

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<CardTypeName | null>(null);
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Participants | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  useEffect(() => {
    setSelectedTopic(null);
    setSelectedTone(null);
    setSelectedParticipants(null);
    setSelectedRelationship(null);
  }, [selectedCardType]);

  useEffect(() => {
    if (selectedParticipants === "Solo") {
      setSelectedRelationship("Self");
    } else if (selectedRelationship === "Self") {
      setSelectedRelationship(null);
    }
  }, [selectedParticipants]);

  const handleApplyFiltersAndGenerate = async () => {
    if (!selectedCardType) {
      Alert.alert('Card Type Required', 'Please select a card type before generating prompts.');
      return;
    }

    const filters: FilterParams = {
      topic: selectedTopic,
      card_type: selectedCardType,
      tone: selectedTone,
      participants: selectedParticipants,
      relationship: selectedRelationship,
    };

    setIsGeneratingSheetState(true);
    showBottomSheet();
    
    await triggerCardGeneration(filters);
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
    if (selectedParticipants === "Solo") {
      return ["Self"];
    }
    return [...CARD_TYPES[selectedCardType].relationships].filter(rel => rel !== "Self");
  };

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

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Card Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {FILTER_OPTIONS.cardTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterButton, selectedCardType === type && styles.selectedFilterButton]}
                  onPress={() => setSelectedCardType(selectedCardType === type ? null : type)}
                >
                  <Text style={[styles.filterButtonText, selectedCardType === type && styles.selectedFilterButtonText]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

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
                  {getParticipants().map((participants) => (
                    <TouchableOpacity
                      key={participants}
                      style={[styles.filterButton, selectedParticipants === participants && styles.selectedFilterButton]}
                      onPress={() => setSelectedParticipants(selectedParticipants === participants ? null : participants)}
                    >
                      <Text style={[styles.filterButtonText, selectedParticipants === participants && styles.selectedFilterButtonText]}>
                        {participants}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {selectedParticipants !== "Solo" && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Relationship</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {getRelationships().map((relationship) => (
                      <TouchableOpacity
                        key={relationship}
                        style={[styles.filterButton, selectedRelationship === relationship && styles.selectedFilterButton]}
                        onPress={() => setSelectedRelationship(selectedRelationship === relationship ? null : relationship)}
                      >
                        <Text style={[styles.filterButtonText, selectedRelationship === relationship && styles.selectedFilterButtonText]}>
                          {relationship}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.generateButton, !selectedCardType && styles.disabledButton]} 
              onPress={handleApplyFiltersAndGenerate} 
              disabled={!selectedCardType || generationState.isGeneratingCards}
            >
              {generationState.isGeneratingCards ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.generateButtonText}>Generate</Text>
              )}
            </TouchableOpacity>
          </View>

          {generationState.error && (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{generationState.error}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#402E22',
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#402E22',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 12,
  },
  filterScroll: {
    // Styles for the horizontal scroll view if needed
  },
  filterButton: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedFilterButton: {
    backgroundColor: '#A97C63',
    borderColor: '#A97C63',
  },
  filterButtonText: {
    fontSize: 15,
    color: '#402E22',
    fontFamily: 'Nunito_600SemiBold',
  },
  selectedFilterButtonText: {
    color: '#FFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 10,
  },
  resetButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#402E22',
    fontFamily: 'Nunito_700Bold',
  },
  generateButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#A97C63',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#A97C63",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  generateButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'Nunito_700Bold',
  },
  disabledButton: {
    backgroundColor: '#D3C1B7',
    shadowOpacity: 0.1,
  },
  errorContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    color: '#B71C1C',
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
  }
});