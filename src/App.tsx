import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import { ModeProvider } from "@/contexts/ModeContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { FocusManager } from "@/components/accessibility/FocusManager";
import { PerformanceMonitor } from "@/components/performance/PerformanceMonitor";
import { SkipLink } from "@/components/performance/SkipLink";
import { LazyRoute } from "@/components/performance/LazyRoute";
// Critical routes - load immediately
import Index from "./pages/Index";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import LoginPageEnhanced from "./pages/auth/LoginPageEnhanced";
import Landing from "./pages/Landing";

// Lazy load heavy pages for better initial load performance
const Home = () => <LazyRoute factory={() => import("./pages/Home")} />
const FeedPage = () => <LazyRoute factory={() => import("./pages/FeedPage")} />
const NewStory = () => <LazyRoute factory={() => import("./pages/NewStory")} />
const StoryDetail = () => <LazyRoute factory={() => import("./pages/StoryDetail")} />
const Prompts = () => <LazyRoute factory={() => import("./pages/Prompts")} />
const FamilyTree = () => <LazyRoute factory={() => import("./pages/FamilyTree")} />
const PersonProfile = () => <LazyRoute factory={() => import("./pages/PersonProfile")} />
const Collections = () => <LazyRoute factory={() => import("./pages/Collections")} />
const Media = () => <LazyRoute factory={() => import("./pages/Media")} />
const SearchPage = () => <LazyRoute factory={() => import("./pages/Search")} />
const Profile = () => <LazyRoute factory={() => import("./pages/Profile")} />
const Settings = () => <LazyRoute factory={() => import("./pages/Settings")} />
const PromptHub = () => <LazyRoute factory={() => import("./pages/PromptHub")} />
const TributeDetail = () => <LazyRoute factory={() => import("./pages/TributeDetail")} />

// Keep smaller/lighter pages as regular imports
import TestAdminBootstrap from "./pages/admin/TestAdminBootstrap";
import SignupPage from "./pages/auth/Signup";
import VerifyPage from "./pages/auth/Verify";
import ResetRequestPage from "./pages/auth/ResetRequest";
import ResetConfirmPage from "./pages/auth/ResetConfirm";
import Onboarding from "./pages/Onboarding";
import OnboardingWizard from "./pages/OnboardingWizard";
import AuthGate from "./components/auth/AuthGate";
import RoleGate from "./components/auth/RoleGate";
import PromptsBrowse from "./pages/PromptsBrowse";
import FamilyMembers from "./pages/FamilyMembers";
import SharingPermissions from "./pages/SharingPermissions";
import FamilyTreeExplorer from "./pages/FamilyTreeExplorer";
import FamilyTreeFan from "./pages/FamilyTreeFan";
import { PersonTimeline } from "./pages/PersonTimeline";
import RecipeWizard from "./components/recipe/RecipeWizard";
import ObjectsNew from "./pages/ObjectsNew";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeEdit from "./pages/RecipeEdit";
import CookMode from "./pages/CookMode";
import ThingDetail from "./pages/ThingDetail";
import ThingEdit from "./pages/ThingEdit";
import PropertyDetail from "./pages/PropertyDetail";
import PetDetail from "./pages/PetDetail";
import PetNew from "./pages/PetNew";
import PetEdit from "./pages/PetEdit";
import PropertyNew from "./pages/PropertyNew";
import PropertyEdit from "./pages/PropertyEdit";
import StoryEdit from "./pages/StoryEdit";
import Capture from "./pages/Capture";
import Events from "./pages/Events";
import Labs from "./pages/Labs";
import LabsSpaces from "./pages/LabsSpaces";
import LabsGuard from "./components/navigation/LabsGuard";
import NotFound from "./pages/NotFound";
import InviteLanding from "./pages/InviteLanding";
import FamilyInvitations from "./pages/FamilyInvitations";
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import People from './pages/People'
import DateFormattingExamplePage from './pages/DateFormattingExample'
import AdminShell from './components/admin/AdminShell'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPeople from './pages/admin/AdminPeople'
import AdminDigest from './pages/admin/AdminDigest'
import AdminFeatureFlags from './pages/admin/AdminFeatureFlags'
import AdminAudit from './pages/admin/AdminAudit'
import AdminContent from './pages/admin/AdminContent'
import FamilyOverviewTable from './components/admin/FamilyOverviewTable'
import ActivationDashboard from './pages/admin/ActivationDashboard'
import NudgeOrchestrator from './components/admin/NudgeOrchestrator';
import ContentModerationPanel from './components/admin/ContentModerationPanel'
import UserPermissionsDashboard from './components/admin/UserPermissionsDashboard'  
import ActivityReportsPanel from './components/admin/ActivityReportsPanel'
import { MediaPipelineMonitor } from './components/admin/MediaPipelineMonitor';
import { ContentTimelineAdmin } from './components/admin/ContentTimelineAdmin';
import RequestAccess from "./pages/RequestAccess";
import DateLocalizationTest from './components/admin/DateLocalizationTest';
import BugInbox from './pages/admin/BugInbox';
import BugDetail from './pages/admin/BugDetail';
import AdminConfig from './pages/admin/AdminConfig';
import AdminUserManagement from '@/pages/admin/AdminUserManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import { BugReportWidget } from './components/BugReportWidget';
import PromptsWow from './pages/PromptsWow';
import { ABTestProvider } from './components/analytics/ABTestProvider';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import EventJoin from './pages/EventJoin';
import AdminLabs from './pages/admin/AdminLabs';
import AdminDebugRoles from './pages/admin/AdminDebugRoles';
import ProfileDebug from './pages/ProfileDebug';

const queryClient = new QueryClient();

function AppContent() {
  // Apply mobile optimizations globally
  useMobileOptimizations()
  
  return (
    <FocusManager>
      {/* Skip links for keyboard navigation */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/family/invitations" element={<FamilyInvitations />} />
      <Route path="/invite/:token" element={<InviteLanding />} />
      <Route path="/join/:code" element={<EventJoin />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      
      {/* Auth routes */}
          <Route path="/auth/login" element={<LoginPageEnhanced />} />
          <Route path="/admin/test-bootstrap" element={<TestAdminBootstrap />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/verify" element={<VerifyPage />} />
      <Route path="/auth/reset/request" element={<ResetRequestPage />} />
      <Route path="/auth/reset/confirm" element={<ResetConfirmPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Onboarding (auth required) */}
      <Route path="/onboarding" element={<AuthGate><OnboardingWizard /></AuthGate>} />
       <Route path="/home" element={<AuthGate><Home /></AuthGate>} />
        <Route path="/prompts/wow" element={<AuthGate><PromptsWow /></AuthGate>} />
        
        {/* Redirect /feed to /home */}
      <Route path="/feed" element={<Navigate to="/home" replace />} />
      
      {/* Story routes with legacy redirect */}
      <Route path="/simple/story/new" element={<Navigate to="/stories/new" replace />} />
      <Route path="/stories/new" element={<AuthGate><NewStory /></AuthGate>} />
      <Route path="/stories/:id" element={<AuthGate><StoryDetail /></AuthGate>} />
      <Route path="/stories/:id/edit" element={<AuthGate><StoryEdit /></AuthGate>} />
      <Route path="/prompts" element={<AuthGate><Prompts /></AuthGate>} />
      <Route path="/prompts/hub" element={<AuthGate><PromptHub /></AuthGate>} />
      <Route path="/prompts/browse" element={<AuthGate><PromptsBrowse /></AuthGate>} />
      <Route path="/sharing" element={<AuthGate><SharingPermissions /></AuthGate>} />
      <Route path="/family/tree" element={<AuthGate><FamilyTree /></AuthGate>} />
      <Route path="/family-tree/explorer" element={<AuthGate><LabsGuard feature="alternateTreeViews"><FamilyTreeExplorer /></LabsGuard></AuthGate>} />
      <Route path="/family-tree/fan" element={<AuthGate><LabsGuard feature="alternateTreeViews"><FamilyTreeFan /></LabsGuard></AuthGate>} />
      <Route path="/people" element={<AuthGate><People /></AuthGate>} />
      <Route path="/people/:id" element={<AuthGate><PersonProfile /></AuthGate>} />
      <Route path="/people/:id/timeline" element={<AuthGate><PersonTimeline /></AuthGate>} />
       <Route path="/profile" element={<AuthGate><Profile /></AuthGate>} />
       <Route path="/profile/debug" element={<AuthGate><ProfileDebug /></AuthGate>} />
       <Route path="/settings" element={<AuthGate><Settings /></AuthGate>} />
       <Route path="/events" element={<AuthGate><Events /></AuthGate>} />
       <Route path="/tribute/:id" element={<AuthGate><TributeDetail /></AuthGate>} />
       <Route path="/labs" element={<AuthGate><Labs /></AuthGate>} />
       <Route path="/labs/spaces" element={<AuthGate><LabsGuard feature="multiSpaces"><LabsSpaces /></LabsGuard></AuthGate>} />
      <Route path="/collections" element={<AuthGate><LabsGuard feature="collections"><Collections /></LabsGuard></AuthGate>} />
      <Route path="/collections/:tab" element={<AuthGate><LabsGuard feature="collections"><Collections /></LabsGuard></AuthGate>} />
      {/* Backward compatibility */}
      <Route path="/archive" element={<AuthGate><LabsGuard feature="collections"><Collections /></LabsGuard></AuthGate>} />
      <Route path="/recipes/new" element={<AuthGate><LabsGuard feature="collections"><RecipeWizard /></LabsGuard></AuthGate>} />
      <Route path="/recipes/:id" element={<AuthGate><LabsGuard feature="collections"><RecipeDetail /></LabsGuard></AuthGate>} />
      <Route path="/recipes/:id/edit" element={<AuthGate><LabsGuard feature="collections"><RecipeEdit /></LabsGuard></AuthGate>} />
      <Route path="/recipes/:id/cook" element={<AuthGate><LabsGuard feature="collections"><CookMode /></LabsGuard></AuthGate>} />
      <Route path="/objects/new" element={<AuthGate><LabsGuard feature="collections"><ObjectsNew /></LabsGuard></AuthGate>} />
      <Route path="/things/:id" element={<AuthGate><LabsGuard feature="collections"><ThingDetail /></LabsGuard></AuthGate>} />
      <Route path="/things/:id/edit" element={<AuthGate><LabsGuard feature="collections"><ThingEdit /></LabsGuard></AuthGate>} />
      <Route path="/properties/new" element={<AuthGate><LabsGuard feature="collections"><PropertyNew /></LabsGuard></AuthGate>} />
      <Route path="/properties/:id/edit" element={<AuthGate><LabsGuard feature="collections"><PropertyEdit /></LabsGuard></AuthGate>} />
      <Route path="/properties/:id" element={<AuthGate><LabsGuard feature="collections"><PropertyDetail /></LabsGuard></AuthGate>} />
      <Route path="/pets/new" element={<AuthGate><LabsGuard feature="collections"><PetNew /></LabsGuard></AuthGate>} />
      <Route path="/pets/:id" element={<AuthGate><LabsGuard feature="collections"><PetDetail /></LabsGuard></AuthGate>} />
       <Route path="/pets/:id/edit" element={<AuthGate><LabsGuard feature="collections"><PetEdit /></LabsGuard></AuthGate>} />
       <Route path="/capture" element={<AuthGate><Capture /></AuthGate>} />
       <Route path="/media" element={<AuthGate><Media /></AuthGate>} />
       <Route path="/media/albums" element={<AuthGate><Media /></AuthGate>} />
        <Route path="/search" element={<AuthGate><SearchPage /></AuthGate>} />
      <Route path="/digest/pause" element={<LazyRoute factory={() => import('./pages/DigestPause')} />} />
      
      {/* Admin Routes - Role-protected */}
       <Route path="/admin" element={<AuthGate><RoleGate role="admin"><AdminShell /></RoleGate></AuthGate>}>
          <Route index element={<AdminDashboard />} />
          <Route path="people" element={<AdminPeople />} />
            <Route path="families" element={<FamilyOverviewTable />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="feature-flags" element={<AdminFeatureFlags />} />
            <Route path="digest" element={<AdminDigest />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="activation" element={<ActivationDashboard />} />
            <Route path="labs" element={<AdminLabs />} />
            <Route path="debug-roles" element={<AdminDebugRoles />} />
            <Route path="nudges" element={<NudgeOrchestrator />} />
          <Route path="content-moderation" element={<ContentModerationPanel />} />
          <Route path="user-management" element={<UserPermissionsDashboard />} />
          <Route path="activity-reports" element={<ActivityReportsPanel />} />
            <Route path="media-pipeline" element={<MediaPipelineMonitor />} />
             <Route path="content" element={<ContentTimelineAdmin />} />
             <Route path="date-localization" element={<DateLocalizationTest />} />
             <Route path="bugs" element={<BugInbox />} />
             <Route path="bugs/:id" element={<BugDetail />} />
             <Route path="labs" element={<AdminLabs />} />
             <Route path="debug-roles" element={<AdminDebugRoles />} />
           <Route path="growth" element={<div className="p-8"><h1 className="text-2xl font-bold">Growth & Digests</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
           <Route path="config" element={<AdminConfig />} />
           <Route path="analytics" element={<AdminAnalytics />} />
           <Route path="integrations" element={<div className="p-8"><h1 className="text-2xl font-bold">Integrations</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
           <Route path="ops" element={<div className="p-8"><h1 className="text-2xl font-bold">Ops & Observability</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
           <Route path="audit" element={<div className="p-8"><h1 className="text-2xl font-bold">Compliance & Audit</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
        </Route>
       
       <Route path="*" element={<NotFound />} />
    </Routes>
    </FocusManager>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ModeProvider>
        <ABTestProvider>
          <AnalyticsProvider>
            <Toaster />
            <Sonner />
            <PerformanceMonitor />
            <ImpersonationProvider>
              <AppContent />
              <BugReportWidget />
            </ImpersonationProvider>
          </AnalyticsProvider>
        </ABTestProvider>
      </ModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;