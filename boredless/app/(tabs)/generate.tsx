import { useState, useCallback, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentGeneration } from '../../context/TabContext';
import { useBottomSheetVisibility } from '../../context/TabContext';
import { useToast } from '../../context/ToastContext';
import { 
  FILTER_OPTIONS, 
  CARD_TYPES,
  CardTypeName, 
  Topic, 
  Tone, 
  Participants, 
  Relationship,
  getRecommendedFilters
} from '../../constants/cardTypes';
import { useFontLoader } from '../../hooks/useFontLoader';
import { FilterParams } from "../../utils/cardUtils";
import EngagingLoadingScreen from '../../components/EngagingLoadingScreen';

export default function GenerateScreen() {
  const { triggerCardGeneration, generationState } = useCurrentGeneration();
  const { showToast } = useToast();

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
      showToast('Please select a card type before generating prompts.', 'warning');
      return;
    }

    const filters: FilterParams = {
      topic: selectedTopic,
      card_type: selectedCardType,
      tone: selectedTone,
      participants: selectedParticipants,
      relationship: selectedRelationship,
    };

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
      <ScrollView contentContainerStyle={styles.mainScrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section - matching home.tsx */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Create custom conversations</Text>
          <Text style={styles.heroSubtitle}>Choose your card type and customize with filters to generate the perfect conversation topics</Text>
        </View>

        {/* Card Type Section */}
        <View style={styles.sectionContainer}>
          <View>
            <Text style={styles.sectionTitle}>Card Type</Text>
            <Text style={styles.sectionSubtitle}>Choose the style of conversation you want</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <View style={styles.horizontalListContainer}>
            {FILTER_OPTIONS.cardTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterCard, selectedCardType === type && styles.selectedFilterCard]}
                onPress={() => setSelectedCardType(selectedCardType === type ? null : type)}
              >
                <Text style={[styles.filterCardTitle, selectedCardType === type && styles.selectedFilterCardTitle]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {shouldShowFilters && (
          <>
            {/* Topic Section */}
            <View style={styles.sectionContainer}>
              <View>
                <Text style={styles.sectionTitle}>Topic</Text>
                <Text style={styles.sectionSubtitle}>What do you want to talk about?</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              <View style={styles.horizontalListContainer}>
                {getTopics().map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.filterChip, selectedTopic === topic && styles.selectedFilterChip]}
                    onPress={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                  >
                    <Text style={[styles.filterChipText, selectedTopic === topic && styles.selectedFilterChipText]}>
                      {topic}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Tone Section */}
            <View style={styles.sectionContainer}>
              <View>
                <Text style={styles.sectionTitle}>Tone</Text>
                <Text style={styles.sectionSubtitle}>Set the mood for your conversation</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              <View style={styles.horizontalListContainer}>
                {getTones().map((tone) => (
                  <TouchableOpacity
                    key={tone}
                    style={[styles.filterChip, selectedTone === tone && styles.selectedFilterChip]}
                    onPress={() => setSelectedTone(selectedTone === tone ? null : tone)}
                  >
                    <Text style={[styles.filterChipText, selectedTone === tone && styles.selectedFilterChipText]}>
                      {tone}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Participants Section */}
            <View style={styles.sectionContainer}>
              <View>
                <Text style={styles.sectionTitle}>Participants</Text>
                <Text style={styles.sectionSubtitle}>How many people will be involved?</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              <View style={styles.horizontalListContainer}>
                {getParticipants().map((participants) => (
                  <TouchableOpacity
                    key={participants}
                    style={[styles.filterChip, selectedParticipants === participants && styles.selectedFilterChip]}
                    onPress={() => setSelectedParticipants(selectedParticipants === participants ? null : participants)}
                  >
                    <Text style={[styles.filterChipText, selectedParticipants === participants && styles.selectedFilterChipText]}>
                      {participants}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Relationship Section */}
            {selectedParticipants !== "Solo" && (
              <>
                <View style={styles.sectionContainer}>
                  <View>
                    <Text style={styles.sectionTitle}>Relationship</Text>
                    <Text style={styles.sectionSubtitle}>What's your relationship to the group?</Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  <View style={styles.horizontalListContainer}>
                    {getRelationships().map((relationship) => (
                      <TouchableOpacity
                        key={relationship}
                        style={[styles.filterChip, selectedRelationship === relationship && styles.selectedFilterChip]}
                        onPress={() => setSelectedRelationship(selectedRelationship === relationship ? null : relationship)}
                      >
                        <Text style={[styles.filterChipText, selectedRelationship === relationship && styles.selectedFilterChipText]}>
                          {relationship}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </>
        )}

        {/* Action Buttons */}
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
              <EngagingLoadingScreen variant="mini" showBackground={false} />
            ) : (
              <Text style={styles.generateButtonText}>Generate Cards</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {generationState.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{generationState.error}</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  mainScrollContainer: {
    paddingBottom: 120, // Extra padding to prevent bottom sheet from covering buttons
  },
  // Hero Section - matching home.tsx
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 8,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'Petrona-Regular',
    lineHeight: 24,
  },
  // Section Headers - matching home.tsx
  sectionContainer: {
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#1A202C',
    fontFamily: 'Petrona-Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'Petrona-Regular',
  },
  // Horizontal scrolling - matching home.tsx pattern
  horizontalScroll: {
    marginBottom: 8,
  },
  horizontalListContainer: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: 'row',
  },
  // Card Type Cards - larger like quick start items
  filterCard: {
    width: 140,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFilterCard: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  filterCardTitle: {
    fontFamily: 'Petrona-Bold',
    fontSize: 16,
    color: '#1A202C',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedFilterCardTitle: {
    color: '#FFFFFF',
  },
  // Filter Chips - smaller for other options
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedFilterChip: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  filterChipText: {
    fontSize: 14,
    color: '#1A202C',
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
  },
  selectedFilterChipText: {
    color: '#FFFFFF',
    fontFamily: 'Petrona-Bold',
  },
  // Action Buttons
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  resetButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'Petrona-Bold',
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  generateButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Petrona-Bold',
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
  },
  // Error Display
  errorContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FED7D7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});