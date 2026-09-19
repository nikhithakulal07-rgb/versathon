import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CurriculumBrowserPage } from './pages/CurriculumBrowserPage';
import { TopicHubPage } from './pages/TopicHubPage';
import { OpenLearningPage } from './pages/OpenLearningPage';
import { GameHomePage } from './pages/GameHomePage';
import { MissionPage } from './pages/MissionPage';
import { CosmeticShopPage } from './pages/CosmeticShopPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { LessonPage } from './pages/LessonPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { RevisionRequiredPage } from './pages/RevisionRequiredPage';
import { AdaptiveTestPage } from './pages/AdaptiveTestPage';
import { ReportCardPage } from './pages/ReportCardPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SoundProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Onboarding */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Authenticated Routes with AppLayout & Navbar */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout><DashboardPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* School Mode */}
                <Route
                  path="/school"
                  element={
                    <ProtectedRoute>
                      <AppLayout><CurriculumBrowserPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/topic/:topicId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><TopicHubPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Open Learning Mode */}
                <Route
                  path="/open"
                  element={
                    <ProtectedRoute>
                      <AppLayout><OpenLearningPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Game Mode ("Skyforge Academy") */}
                <Route
                  path="/game"
                  element={
                    <ProtectedRoute>
                      <AppLayout><GameHomePage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/game/mission/:missionId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><MissionPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/game/shop"
                  element={
                    <ProtectedRoute>
                      <AppLayout><CosmeticShopPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Shared Learning Pipeline Routes */}
                <Route
                  path="/diagnostic/:topicId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><DiagnosticPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lesson/:subtopicId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><LessonPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/flashcards/:subtopicId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><FlashcardsPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/revision"
                  element={
                    <ProtectedRoute>
                      <AppLayout><RevisionRequiredPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test/:topicId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><AdaptiveTestPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report/:testId"
                  element={
                    <ProtectedRoute>
                      <AppLayout><ReportCardPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* User & Analytics */}
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout><LeaderboardPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute>
                      <AppLayout><ProgressPage /></AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AppLayout><ProfilePage /></AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* 404 Catch-all */}
                <Route path="*" element={<AppLayout><NotFoundPage /></AppLayout>} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </SoundProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
