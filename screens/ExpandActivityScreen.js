
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, Animated } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SquareCheckbox, CircleCheckbox } from "./Checkbox";

const numColumns = 2;
const buttonMargin = 5;
const buttonSize = ((Dimensions.get("window").width - buttonMargin * (numColumns * 2)) / numColumns) * 0.55;
const ExpandActivityScreen = ({ route, navigation }) => {
    const { sessionID, savedActivityID } = route.params;
    const [activityContent, setActivityContent] = useState(null);
    const [materialsChecked, setMaterialsChecked] = useState([]);
    const [instructionsChecked, setInstructionsChecked] = useState([]);
    const [isActivityCompleted, setIsActivityCompleted] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
    const [loading, setLoading] = useState(true);

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

    const buttonHandler = async () => {
        await updateActivity();
        navigation.navigate('Saved');
    };
 
    const updateActivity = async () => {
        try {
            const response = await axios.put(`http://127.0.0.1:5000/update_activity/${sessionID}/${savedActivityID}`, {
                materialsChecked: materialsChecked,
                instructionsChecked: instructionsChecked,
                isCompleted: isActivityCompleted,
                lastUpdated: lastUpdated,
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log("Activity updated successfully");
        } catch (error) {
            console.error('Failed to update activity:', error.response ? error.response.data : error);
        }
    };
    
    useEffect(() => {
        const fetchActivityDetails = async () => {
            setLoading(true);
            console.log(`Fetching details for session ID: ${sessionID}, activity ID: ${savedActivityID}`); // Log the ID being used for fetching
            try {
                const response = await axios.get(`http://127.0.0.1:5000/get_activity/${sessionID}/${savedActivityID}`);
                console.log('Activity details fetched successfully:');
                
                // Update activity content
                setActivityContent(response.data);
                setMaterialsChecked(response.data.materialsChecked || new Array(response.data.materials.split('\n').length).fill(false));
                setInstructionsChecked(response.data.instructionsChecked || new Array(response.data.instructions.split('\n').length).fill(false));
                setLastUpdated(response.data.lastUpdated);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch activity details:', error);
                console.log(`Error details: ${error.response ? error.response.data : 'No additional error information'}`); // Log error details
            }
        };

        fetchActivityDetails();
    }, [sessionID, savedActivityID]);

    useEffect(() => {
        const allMaterialsChecked = materialsChecked.every(Boolean); // True if all materials are checked
        const allInstructionsChecked = instructionsChecked.every(Boolean); // True if all instructions are checked
        setIsActivityCompleted(allMaterialsChecked && allInstructionsChecked);
    }, [materialsChecked, instructionsChecked]);

    //Page Rendering
    return (
        <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: '#fafafc', }}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={{ marginTop: 20 }}>Loading activity...</Text>
                </View>
            ) : (
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Activity Image */}
                    {activityContent.activityImage && (
                        <View style={[styles.imageContainer]}>
                            <Image
                                style={styles.activityImage}
                                source={{ uri: `data:image/png;base64,${activityContent.activityImage}` }}
                            />
                        </View>
                    )}

                    {/* Activity Title */}
                    <Text style={styles.activityTitle}>{activityContent.title}</Text>
                    <View style={styles.separator} />

                    {/* Activity Introduction */}
                    <Text style={styles.introText}>{activityContent.introduction}</Text>
                    <View style={styles.separator} />


                    {/* Activity Materials Needed*/}
                    <Text style={styles.titleText}>Materials Needed</Text>
                    <View>
                        {activityContent.materials.split('\n').map((material, index) => {
                            material = material.replace(/^-/, '•').trim();
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
                    </View>
                    <View style={styles.separator} />

                    {/* Activity Instructions*/}
                    <Text style={styles.titleText}>Instructions</Text>
                    <View>
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
                    </View>
                </ScrollView>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.continueLaterButton]} // Ensure you have styles defined for this
                        onPress={buttonHandler}
                    >
                        <Text style={[styles.buttonText, styles.continueLaterButtonText]}>
                            Continue Later
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.completeButton, !isActivityCompleted && styles.buttonDisabled]} // Apply disabled style if not isActivityCompleted
                        onPress={buttonHandler}
                        disabled={!isActivityCompleted} 
                    >
                        <Text style={[styles.buttonText, styles.completeButtonText]}>
                            Complete
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // Containers
    container: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: 18,
        backgroundColor: '#fafafc',
    },
    imageContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderColor: '#fff',
        backgroundColor: '#fafafc',
    },

    // Activity Style
    activityImage: {
        width: "100%",
        height: 260,
        borderRadius: 20,
        marginTop: 17,
        marginBottom: 20,
    },
    activityTitle: {
        fontSize: 20,
        textAlign: "left",
        fontWeight: "bold",
        fontFamily: 'Montserrat-SemiBold',
    },
    introText: {
        fontSize: 13,
        textAlign: "left",
        fontFamily: 'Montserrat-Regular',
    },
    materialText: {
        fontSize: 13,
        textAlign: "left",
        maxWidth: "70%",
        fontFamily: 'Montserrat-Regular',
    },
    instructionText: {
        fontSize: 13,
        textAlign: "left",
        maxWidth: "70%",
        fontFamily: 'Montserrat-Regular',
    },
    titleText: {
        fontSize: 16,
        marginBottom: 5,
        textAlign: "left",
        fontFamily: 'Montserrat-Medium',
    },


    // Button Style
    button: {
        width: 165,
        height: 57,
        borderRadius: buttonSize / 8,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,

        // Android Shadow
        elevation: 8,
    },
    buttonText: {
        fontSize: 14,
    },
    startActivityButton: {
        backgroundColor: "#2b2b2b",
        borderColor: "#000",
        shadowColor: "#000",
    },
    startActivityButtonText: {
        color: "#FFF",
        fontFamily: 'Montserrat-Bold',
    },

    regenerateButton: {
        backgroundColor: "#FFF",
        borderWidth: 1,
        shadowColor: "#000",
    },
    regenerateButtonText: {
        color: "#000",
        fontFamily: 'Montserrat-Bold',
    },

    continueLaterButton: {
        backgroundColor: "#FFF",
        borderWidth: 1,
        shadowColor: "#000",
    },
    continueLaterButtonText: {
        color: "#000",
        fontFamily: 'Montserrat-Bold',
    },

    completeButton: {
        backgroundColor: "#2b2b2b",
        borderRadius: 15,
        paddingVertical: 10,
        alignSelf: 'stretch',

        // iOS Shadow
        shadowColor: '#000', // Shadow color
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3, // Shadow opacity
        shadowRadius: 5, // Blur radius

        // Android Shadow
        elevation: 8,
    },
    completeButtonText: {
        color: "#fff",
        fontFamily: 'Montserrat-Bold',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },

    // Seperator
    separator: {
        height: 1.3,
        width: "100%",
        backgroundColor: "#DFDEDE",
        marginVertical: 15,
    },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Change this color to your preference for the blur effect
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ExpandActivityScreen;