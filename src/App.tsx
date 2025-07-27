import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/main-layout';
import { AuthProvider } from './context/auth-context';
import { useAuth } from './context/auth-context';
import { ThemeProvider } from './context/theme-context';

// Pages
import Home from './pages/Home';
import QAPage from './pages/QAPage';
import ResourcesPage from './pages/ResourcesPage';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import WalletPage from './pages/WalletPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AIFeaturesPage from './pages/AIFeaturesPage';
import NotFound from './pages/NotFound';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import AboutDVTPage from './pages/AboutDVTPage';
import ChatPage from './pages/ChatPage';
import MessagesPage from './pages/MessagesPage';

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/qa" element={<QAPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/post/:postId" element={<PostDetail />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/ai-features" element={<AIFeaturesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/about/dvt" element={<AboutDVTPage />} />
                <Route path="/chat" element={<ChatPage />} />
                
                {/* Messages Routes */}
                <Route 
                  path="/messages" 
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages/:userId" 
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes */}
                <Route 
                  path="/create" 
                  element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/wallet" 
                  element={
                    <ProtectedRoute>
                      <WalletPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;