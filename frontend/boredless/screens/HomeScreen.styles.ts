import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: 'Petrona-Bold',
    color: '#301C11',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: 'Petrona-Regular',
    color: '#9E9E9E', // Light grey color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});