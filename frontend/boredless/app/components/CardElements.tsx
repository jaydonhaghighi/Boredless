import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Renders a card title
 */
export const CardTitle = ({ title }: { title?: string }) => 
  title ? (
    <View style={styles.cardBadgeContainer}>
      <Text style={styles.cardBadgeText}>{title}</Text>
    </View>
  ) : null;

/**
 * Renders a section with a title and children
 */
export const CardSection = ({ 
  title, 
  children 
}: { 
  title: string, 
  children: React.ReactNode 
}) => (
  <View style={styles.cardSection}>
    <Text style={styles.cardSectionTitle}>{title}</Text>
    {children}
  </View>
);

/**
 * Renders the main content of a card
 */
export const CardMainContent = ({ text }: { text?: string }) => 
  text ? (
    <View style={styles.cardMainContent}>
      <Text style={styles.cardMainText}>{text}</Text>
    </View>
  ) : null;

/**
 * Renders a list item with a bullet point
 */
export const CardListItem = ({ 
  text, 
  isCorrect = false,
  index = -1,
  useLetters = false
}: { 
  text: string, 
  isCorrect?: boolean,
  index?: number,
  useLetters?: boolean
}) => (
  <Text 
    style={[
      styles.cardListItem,
      isCorrect && styles.correctAnswer
    ]}
  >
    {useLetters && index >= 0 ? `${String.fromCharCode(65 + index)}. ` : '• '}
    {text}
    {isCorrect ? ' ✓' : ''}
  </Text>
);

const styles = StyleSheet.create({
  cardBadgeContainer: {
    alignSelf: 'center',
  },
  cardBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Petrona-Bold',
  },
  cardMainContent: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 16,
  },
  cardMainText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333333',
    fontFamily: 'Petrona-Regular',
    textAlign: 'center',
  },
  cardSection: {
    marginVertical: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Petrona-Bold',
  },
  cardListItem: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Petrona-Regular',
    marginBottom: 6,
    paddingLeft: 8,
  },
  correctAnswer: {
    color: '#38B000',
    fontWeight: '500',
  }
}); 