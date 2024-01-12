import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { SquareCheckbox, CircleCheckbox } from "./Checkbox";

const numColumns = 2;
const buttonMargin = 5;
const buttonSize = ((Dimensions.get("window").width - buttonMargin * (numColumns * 2)) / numColumns) * 0.55;

const ActivityScreen = ({ navigation, route }) => {
    const [activityContent, setActivityContent] = useState({
        activity: '',
        introduction: '',
        materials: '',
        instructions: ''
    });
    const [currentSection, setCurrentSection] = useState('activity');
    const [isGenerating, setIsGenerating] = useState(false);
    const [initialPrompt, setInitialPrompt] = useState(null);
    const prompt = route.params?.prompt;
    const [loading, setLoading] = useState(true);
    const [shouldContinueFetching, setShouldContinueFetching] = useState(true);
    const [requestKey, setRequestKey] = useState(null);

    const [materialsChecked, setMaterialsChecked] = useState(new Array(activityContent.materials.length).fill(false));
    const [instructionsChecked, setInstructionsChecked] = useState(new Array(activityContent.instructions.length).fill(false));

    const handleMaterialCheckboxChange = (index, newValue) => {
        const updatedMaterialsChecked = [...materialsChecked];
        updatedMaterialsChecked[index] = newValue;
        setMaterialsChecked(updatedMaterialsChecked);
    };
    
    const handleInstructionCheckboxChange = (index, newValue) => {
        const updatedInstructionsChecked = [...instructionsChecked];
        updatedInstructionsChecked[index] = newValue;
        setInstructionsChecked(updatedInstructionsChecked);
    };

    const updateCheckboxes = (materials, instructions) => {
        setMaterialsChecked(new Array(materials.length).fill(false));
        setInstructionsChecked(new Array(instructions.length).fill(false));
    };

    const fetchNextChunk = async (requestKey, currentSection) => {
    
        let chunkResponse = await axios.get(`http://127.0.0.1:5000/next_chunk/${requestKey}`);
        if (!chunkResponse.data.response) {
            console.log("fetchNextChunk: No more data to fetch");
            setIsGenerating(false);
            return;
        }
        
        chunkResponse.data.response.split(' ').forEach(word => {
            console.log("fetchNextChunk: Processing word:", word, "Current section:", currentSection);
            console.log("fetchNextChunk: Current section:", currentSection);
            currentSection = appendContent(word, currentSection);
        });
    
        // Automatically fetch the next chunk after a delay
        setTimeout(() => fetchNextChunk(requestKey, currentSection), 50);
    };
        
    const processActivity = async (apiEndpoint, apiPayload) => {
        console.log(`processActivity: Sending request with payload:`, apiPayload);
        setIsGenerating(true);
    
        let shouldContinue = true; // Local variable to control the fetching loop
    
        const fetchNextChunk = async () => {
            console.log("fetchNextChunk: 2");
            if (!shouldContinue) {
                setIsGenerating(false);
                return;
            }
    
            let chunkResponse = await axios.get(`http://127.0.0.1:5000/next_chunk/${requestKey}`);
            if (!chunkResponse.data.response) {
                setIsGenerating(false);
                return;
            }
    
            chunkResponse.data.response.split(' ').forEach(word => {
                section = appendContent(word, section);
                if (word.trim().toLowerCase() === "materials:") {
                    setCurrentSection('materials');
                    shouldContinue = false; // Update the local variable to stop further fetching
                }
            });
    
            if (shouldContinue) {
                setTimeout(fetchNextChunk, 50); // Continue fetching only if the condition is met
            } else {
                setIsGenerating(false); // Stop the generation process
            }
        };
    
        // Initial fetch from the API
        let response = await axios.post(`http://127.0.0.1:5000/${apiEndpoint}`, apiPayload);
        console.log("Response received:", response.data);
    
        let section = 'activity';
        response.data.response.split(' ').forEach(word => {
            section = appendContent(word, section);
            if (word.trim().toLowerCase() === "materials:") {
                shouldContinue = false; // Stop the initial fetching process
            }
        });

        const requestKey = response.data.request_key;
        console.log("fetchNextChunk called with requestKey1:", requestKey);
        setRequestKey(requestKey);
        setLoading(false);
    
        if (shouldContinue) {
            fetchNextChunk(); // Start the fetching process
        } else {
            setIsGenerating(false);
        }
    };

    const generateActivity = async () => {
        updateCheckboxes(activityContent.materials.split('\n'), activityContent.instructions.split('\n'));
        processActivity('generate', { prompt });
    };
    
    const refreshActivity = async () => {
        setLoading(true);
        updateCheckboxes(activityContent.materials.split('\n'), activityContent.instructions.split('\n'));
        setActivityContent({
            activity: '',
            introduction: '',
            materials: '',
            instructions: ''
        });
        setCurrentSection('activity');
        processActivity('regenerate', { prompt: initialPrompt });
    };

    const appendContent = (word, currentSection) => {
        console.log(`Processing word: ${word.trim()}, Current section: ${currentSection}`);
        
        word = word.trim();
    
        if (word.toLowerCase() === "note:") {
            // Stop appending content once we detect "Note:"
            return 'end';
        } else if (word.toLowerCase() === "activity:") {
            console.log("Switched to 'activity' section");
            return 'activity';
        } else if (word.toLowerCase() === "introduction:") {
            console.log("Switched to 'introduction' section");
            return 'introduction';
        } else if (word.toLowerCase() === "materials:") {
            console.log("Switched to 'materials' section");
            return 'materials';
        } else if (word.toLowerCase() === "instructions:") {
            console.log("Switched to 'instructions' section");
            return 'instructions';
        } else if (currentSection !== 'end') {
            setActivityContent(prevContent => {
                let updatedSection;
                if (word === "-" && prevContent[currentSection] && !prevContent[currentSection].endsWith("\n") && prevContent[currentSection] !== '') {
                    updatedSection = prevContent[currentSection] + '\n' + word;
                } else if (word.endsWith(".") && !isNaN(word.charAt(0)) && prevContent[currentSection] && !prevContent[currentSection].endsWith("\n") && prevContent[currentSection] !== '') {
                    updatedSection = prevContent[currentSection] + '\n' + word;
                } else {
                    const separator = prevContent[currentSection] ? ' ' : '';
                    updatedSection = prevContent[currentSection] + separator + word;
                }
                return {
                    ...prevContent,
                    [currentSection]: updatedSection.trimStart()  // This will ensure that the content does not start with a space
                };
            });
        }
        return currentSection;
    };
    
    const handleStartActivity = () => {
        console.log("Starting activity...");
        setShouldContinueFetching(false);
        setIsGenerating(true);
        fetchNextChunk(requestKey, currentSection);
    }

    useFocusEffect(
        React.useCallback(() => {
            console.log("Focus Effect: prompt =", prompt);
            setLoading(true);
            setActivityContent({
                activity: '',
                introduction: '',
                materials: '',
                instructions: ''
            });
            setCurrentSection('activity');
            if (prompt) {
                setInitialPrompt(prompt); // Setting initial prompt
                console.log("Setting initialPrompt:", prompt);
                generateActivity();
            }
        }, [prompt])
    );

    const scrollViewRef = useRef(null);
    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [activityContent]);

    return (
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={{ marginTop: 20 }}>Generating activity...</Text>
                </View>
            ) : (
                <View style={styles.container}>
                    <ScrollView 
                        contentContainerStyle={styles.scrollContainer} 
                        showsVerticalScrollIndicator={false}
                        ref={scrollViewRef}
                    >
                        <Text style={styles.activityTitle}>{activityContent.activity}</Text>
                        <View style={styles.separator} />

                        <Text style={styles.introduction}>{activityContent.introduction}</Text>
                        <View style={styles.separator} />

                        {/* Render Materials Needed section only if there's content */}
                        {activityContent.materials && activityContent.materials.trim().length > 0 && (
                            <>
                                <Text style={styles.titleText}>Materials Needed:</Text>
                                {activityContent.materials.split('\n').map((material, index) => {
                                    material = material.replace(/^-/, '').trim();
                                    return (
                                        <View key={index} style={styles.instructionContainer}>
                                            <Text style={styles.materialText}>{material}</Text>
                                            <CircleCheckbox
                                                value={materialsChecked[index]}
                                                onValueChange={(newValue) => {
                                                    handleMaterialCheckboxChange(index, newValue);
                                                }}
                                                color="#000"
                                            />
                                        </View>
                                    );
                                })}
                                <View style={styles.separator} />
                            </>
                        )}

                        {/* Render Instructions section only if there's content */}
                        {activityContent.instructions && activityContent.instructions.trim().length > 0 && (
                            <>
                                <Text style={styles.titleText}>Instructions:</Text>
                                {activityContent.instructions.split('\n').map((instruction, index) => (
                                    <View key={index} style={styles.instructionContainer}>
                                        <Text style={styles.instructionText}>{instruction}</Text>
                                        <SquareCheckbox
                                            value={instructionsChecked[index]}
                                            onValueChange={(newValue) => {
                                                handleInstructionCheckboxChange(index, newValue);
                                            }}
                                            color="#000"
                                        />
                                    </View>
                                ))}
                            </>
                        )}
                    </ScrollView>
                    <View style={styles.buttonContainer}>
                    <TouchableOpacity
                            style={[styles.button, styles.refreshButton]}
                            onPress={refreshActivity}
                            disabled={isGenerating}
                        >
                            <Text style={[styles.buttonText, styles.refreshButtonText]}>
                                Refresh
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.startActivityButton]}
                            onPress={handleStartActivity}
                            >
                            <Text style={[styles.buttonText, styles.startActivityButtonText]}>
                                Start Activity
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "space-between",
      backgroundColor: "#FFF",
      paddingHorizontal: 18,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    fadeOutOverlay: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        height: 30,
    },
    webView: {
      flex: 1,
      margin: 10,
    },
    introText: {
      fontSize: 16,
      textAlign: "left",
    },
    materialText: {
      fontSize: 16,
      textAlign: "left",
      maxWidth: "70%",
    },
    instructionText: {
      fontSize: 16,
      textAlign: "left",
      maxWidth: "70%",
    },
    instructionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    activityTitle: {
      fontSize: 24,
      textAlign: "left",
      fontWeight: "bold",
      paddingTop: 16,
    },
    buttonContainer: {
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingBottom: 10, 
        paddingTop: 10,
        borderTopWidth: 0.3,
        borderColor: '#ccc',
    },
    button: {
      width: 165,
      height: 52,
      borderRadius: buttonSize / 8,
      justifyContent: "center",
      alignItems: "center",
    },
    refreshButton: {
      backgroundColor: "#FFF",
      borderWidth: 1,
    },
    startActivityButton: {
      backgroundColor: "#2b2b2b",
      borderColor: "#000",
    },
    buttonText: {
      fontSize: 18,
      fontWeight: "bold",
    },
    refreshButtonText: {
      color: "#000",
    },
    startActivityButtonText: {
      color: "#FFF",
    },
    separator: {
      height: 1.3,
      width: "100%",
      backgroundColor: "#DFDEDE",
      marginVertical: 15,
    },
    titleText: {
      fontSize: 20,
      marginBottom: 16,
      textAlign: "left",
    },
    photoButton: {
      backgroundColor: "#2b2b2b",
    },
    completeButton: {
      backgroundColor: "#FFF",
      borderWidth: 1,
      borderColor: "#000",
    },
    photoButtonText: {
      color: "#FFF",
    },
    completeButtonText: {
      color: "#000",
    },
  });

export default ActivityScreen;