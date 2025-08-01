import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import EngagingLoadingScreen from '../components/EngagingLoadingScreen';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  console.log('Index - Auth state:', { isAuthenticated, loading });

  // Show loading state while checking auth
  if (loading) {
    console.log('Index - Showing loading screen');
    return <EngagingLoadingScreen variant="fullscreen" showBackground={true} />;
  }

  console.log('Index - Redirecting to:', isAuthenticated ? 'tabs/home' : 'auth/signIn');

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  } else {
    return <Redirect href="/(auth)/signIn" />;
  }
}