import { View, Text, SafeAreaView } from 'react-native';
import { styles } from './HomeScreen.styles';

export const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Welcome Back!</Text>
        <Text style={styles.subtitleText}>
          Ready for some fun conversations? Let's get started.
        </Text>
      </View>
      
      {/* Your existing content can go here */}
    </SafeAreaView>
  );
};