import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import SitemapXML from "./pages/SitemapXML";

// Lazy load heavy pages for better initial load performance
const Home = () => <LazyRoute factory={() => import("./pages/Home")} />
const HomeV2 = () => <LazyRoute factory={() => import("./pages/HomeV2")} />
const FeedPage = () => <LazyRoute factory={() => import("./pages/FeedPage")} />
const NewStory = () => <LazyRoute factory={() => import("./pages/NewStory")} />
const DraftsPage = () => <LazyRoute factory={() => import("./pages/DraftsPage")} />
const StoryDetail = () => <LazyRoute factory={() => import("./pages/StoryDetail")} />
const Prompts = () => <LazyRoute factory={() => import("./pages/Prompts")} />
const PromptsSimple = () => <LazyRoute factory={() => import("./pages/PromptsSimple")} />
const FamilyTree = () => <LazyRoute factory={() => import("./pages/FamilyTree")} />
const PersonProfile = () => <LazyRoute factory={() => import("./pages/PersonProfile")} />
const PersonPage = () => <LazyRoute factory={() => import("./pages/PersonPage")} />
const ModerationQueue = () => <LazyRoute factory={() => import("./pages/StewardTools/ModerationQueue")} />
const AnalyticsPage = () => <LazyRoute factory={() => import("./pages/AnalyticsPage")} />
const StoryAnalytics = () => <LazyRoute factory={() => import("./pages/StoryAnalytics")} />
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
import MeRedirect from "./pages/MeRedirect";
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
import PropertyNew from "./pages/PropertyNew";
import PetNew from "./pages/PetNew";
import PetEdit from "./pages/PetEdit";
import Properties from "./pages/Properties";
import StoryEdit from "./pages/StoryEdit";
import Capture from "./pages/Capture";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventUploadPage from "./pages/EventUploadPage";
import PrintComposer from "./pages/PrintComposer";
import DuplicatesPage from "./pages/DuplicatesPage";
import Portfolio from "./pages/Portfolio";
import Vault from "./pages/Vault";
import Help from "./pages/Help";
import Inbox from "./pages/Inbox";
import Labs from "./pages/Labs";
import StoryNew from "./pages/stories/StoryNew";
import ComposeVoice from "./pages/compose/ComposeVoice";
import ComposeText from "./pages/compose/ComposeText";
import ComposePhotos from "./pages/compose/ComposePhotos";
import ComposeScan from "./pages/compose/ComposeScan";
import ComposeVideo from "./pages/compose/ComposeVideo";
import ComposeMixed from "./pages/compose/ComposeMixed";
import NoteNew from "./pages/notes/NoteNew";
import LabsSpaces from "./pages/LabsSpaces";
import LabsGuard from "./components/navigation/LabsGuard";
import NotFound from "./pages/NotFound";
import InviteLanding from "./pages/InviteLanding";
import InviteAccept from "./pages/InviteAccept";
import FamilyInvitations from "./pages/FamilyInvitations";
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import People from './pages/People'
import PersonPageBySlug from './pages/PersonPageBySlug'
import SitemapPage from './pages/SitemapPage'
import DateFormattingExamplePage from './pages/DateFormattingExample'
import InviteRedeem from './pages/InviteRedeem'
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
import AdminDuplicates from './pages/admin/AdminDuplicates';
import EventUpload from './pages/EventUpload';
import SafeBox from './pages/SafeBox';
import AdminSafeBoxWaitlist from './pages/admin/AdminSafeBoxWaitlist';
import { BugReportWidget } from './components/BugReportWidget';
import PromptsWow from './pages/PromptsWow';
import { ABTestProvider } from './components/analytics/ABTestProvider';
import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
import EventJoin from './pages/EventJoin';
import AdminLabs from './pages/admin/AdminLabs';
import AdminDebugRoles from './pages/admin/AdminDebugRoles';
import ProfileDebug from './pages/ProfileDebug';
import LifeScribeHeader from './components/layout/LifeScribeHeader';
import { AppLayout } from './components/layouts/AppLayout';

const queryClient = new QueryClient();

function AppContent() {
  // Apply mobile optimizations globally
  useMobileOptimizations()
  const location = useLocation();
  
  // Routes that should not show the header OR sidebar
  const noLayoutRoutes = [
    '/login', '/landing', '/auth/login', '/auth/signup', 
    '/auth/verify', '/auth/reset', '/privacy', '/terms',
    '/join/', '/events/', '/invite/'
  ];
  const shouldShowLayout = !noLayoutRoutes.some(route => location.pathname.startsWith(route));
  
  const noHeaderRoutes = [
    '/login', '/landing', '/auth/login', '/auth/signup', 
    '/auth/verify', '/auth/reset', '/privacy', '/terms'
  ];
  const shouldShowHeader = !noHeaderRoutes.some(route => location.pathname.startsWith(route));
  
  
  // Wrapper for authenticated routes with AppLayout
  const AuthLayoutWrapper = ({ children }: { children: ReactNode }) => (
    <AuthGate>
      <AppLayout showHeader={false}>{children}</AppLayout>
    </AuthGate>
  );
  
  return (
    <FocusManager>
      {/* Skip links for keyboard navigation */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      {/* Global Header */}
      {shouldShowHeader && <LifeScribeHeader />}
      
      <Routes>
      {/* Public routes - NO SIDEBAR */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/request-access" element={<RequestAccess />} />
      <Route path="/family/invitations" element={<FamilyInvitations />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/events/:eventId/upload/:token" element={<EventUpload />} />
      <Route path="/join/:code" element={<EventJoin />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      
      {/* SEO routes */}
      <Route path="/p/:slug" element={<PersonPageBySlug />} />
      <Route path="/sitemap.xml" element={<SitemapPage />} />
      
      {/* Auth routes - NO SIDEBAR */}
          <Route path="/auth/login" element={<LoginPageEnhanced />} />
          <Route path="/admin/test-bootstrap" element={<TestAdminBootstrap />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/verify" element={<VerifyPage />} />
      <Route path="/auth/reset/request" element={<ResetRequestPage />} />
      <Route path="/auth/reset/confirm" element={<ResetConfirmPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Onboarding (auth required, NO SIDEBAR) */}
      <Route path="/onboarding" element={<AuthGate><OnboardingWizard /></AuthGate>} />
      
       {/* ALL ROUTES BELOW HAVE PERSISTENT SIDEBAR */}
       <Route path="/home" element={<AuthLayoutWrapper><Home /></AuthLayoutWrapper>} />
       <Route path="/home-v2" element={<AuthLayoutWrapper><HomeV2 /></AuthLayoutWrapper>} />
        <Route path="/prompts/wow" element={<AuthLayoutWrapper><PromptsWow /></AuthLayoutWrapper>} />
        
        {/* Me redirect to person page */}
        <Route path="/me" element={<AuthLayoutWrapper><MeRedirect /></AuthLayoutWrapper>} />
        
        {/* Redirect /feed to /home */}
      <Route path="/feed" element={<Navigate to="/home" replace />} />
      
      {/* Story routes with legacy redirect */}
      <Route path="/simple/story/new" element={<Navigate to="/stories/new" replace />} />
      <Route path="/stories/new-tabbed" element={<AuthLayoutWrapper><StoryNew /></AuthLayoutWrapper>} />
      <Route path="/stories/new" element={<AuthLayoutWrapper><NewStory /></AuthLayoutWrapper>} />
      <Route path="/drafts" element={<AuthLayoutWrapper><DraftsPage /></AuthLayoutWrapper>} />
      <Route path="/stories/drafts" element={<Navigate to="/drafts" replace />} />
      <Route path="/stories/:id" element={<AuthLayoutWrapper><StoryDetail /></AuthLayoutWrapper>} />
      <Route path="/stories/:id/edit" element={<AuthLayoutWrapper><StoryEdit /></AuthLayoutWrapper>} />
      <Route path="/prompts" element={<AuthLayoutWrapper><Prompts /></AuthLayoutWrapper>} />
      <Route path="/prompts/simple" element={<AuthLayoutWrapper><PromptsSimple /></AuthLayoutWrapper>} />
      <Route path="/prompts/hub" element={<AuthLayoutWrapper><PromptHub /></AuthLayoutWrapper>} />
      <Route path="/prompts/browse" element={<AuthLayoutWrapper><PromptsBrowse /></AuthLayoutWrapper>} />
      <Route path="/sharing" element={<AuthLayoutWrapper><SharingPermissions /></AuthLayoutWrapper>} />
      <Route path="/family/tree" element={<AuthLayoutWrapper><FamilyTree /></AuthLayoutWrapper>} />
      <Route path="/family-tree/explorer" element={<AuthLayoutWrapper><LabsGuard feature="alternateTreeViews"><FamilyTreeExplorer /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/family-tree/fan" element={<AuthLayoutWrapper><LabsGuard feature="alternateTreeViews"><FamilyTreeFan /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/people" element={<AuthLayoutWrapper><People /></AuthLayoutWrapper>} />
      <Route path="/people/:id" element={<AuthLayoutWrapper><PersonPage /></AuthLayoutWrapper>} />
      <Route path="/people/:personId/moderation" element={<AuthLayoutWrapper><ModerationQueue /></AuthLayoutWrapper>} />
      <Route path="/people/:id/legacy" element={<AuthLayoutWrapper><PersonProfile /></AuthLayoutWrapper>} />
      <Route path="/people/:id/timeline" element={<AuthLayoutWrapper><PersonTimeline /></AuthLayoutWrapper>} />
      <Route path="/analytics" element={<AuthLayoutWrapper><AnalyticsPage /></AuthLayoutWrapper>} />
      <Route path="/analytics/stories" element={<AuthLayoutWrapper><StoryAnalytics /></AuthLayoutWrapper>} />
       <Route path="/profile" element={<AuthLayoutWrapper><Profile /></AuthLayoutWrapper>} />
       <Route path="/profile/debug" element={<AuthLayoutWrapper><ProfileDebug /></AuthLayoutWrapper>} />
       <Route path="/settings" element={<AuthLayoutWrapper><Settings /></AuthLayoutWrapper>} />
       <Route path="/help" element={<AuthLayoutWrapper><Help /></AuthLayoutWrapper>} />
       <Route path="/inbox" element={<AuthLayoutWrapper><Inbox /></AuthLayoutWrapper>} />
       <Route path="/compose/voice" element={<AuthLayoutWrapper><ComposeVoice /></AuthLayoutWrapper>} />
       <Route path="/compose/text" element={<AuthLayoutWrapper><ComposeText /></AuthLayoutWrapper>} />
       <Route path="/compose/photos" element={<AuthLayoutWrapper><ComposePhotos /></AuthLayoutWrapper>} />
       <Route path="/compose/scan" element={<AuthLayoutWrapper><ComposeScan /></AuthLayoutWrapper>} />
       <Route path="/compose/video" element={<AuthLayoutWrapper><ComposeVideo /></AuthLayoutWrapper>} />
       <Route path="/compose/mixed" element={<AuthLayoutWrapper><ComposeMixed /></AuthLayoutWrapper>} />
       <Route path="/notes/new" element={<AuthLayoutWrapper><NoteNew /></AuthLayoutWrapper>} />
       <Route path="/events" element={<AuthLayoutWrapper><Events /></AuthLayoutWrapper>} />
       <Route path="/event/:eventId" element={<AuthLayoutWrapper><EventDetail /></AuthLayoutWrapper>} />
       <Route path="/event/:eventId/upload" element={<EventUploadPage />} />
       <Route path="/print" element={<AuthLayoutWrapper><PrintComposer /></AuthLayoutWrapper>} />
       <Route path="/print/event/:eventId" element={<AuthLayoutWrapper><PrintComposer /></AuthLayoutWrapper>} />
       <Route path="/admin/duplicates" element={<AuthLayoutWrapper><DuplicatesPage /></AuthLayoutWrapper>} />
       <Route path="/safebox" element={<AuthLayoutWrapper><SafeBox /></AuthLayoutWrapper>} />
       <Route path="/tribute/:id" element={<AuthLayoutWrapper><TributeDetail /></AuthLayoutWrapper>} />
       <Route path="/labs" element={<AuthLayoutWrapper><Labs /></AuthLayoutWrapper>} />
       <Route path="/labs/spaces" element={<AuthLayoutWrapper><LabsGuard feature="multiSpaces"><LabsSpaces /></LabsGuard></AuthLayoutWrapper>} />
       <Route path="/portfolio" element={<AuthLayoutWrapper><Portfolio /></AuthLayoutWrapper>} />
       <Route path="/vault" element={<AuthLayoutWrapper><Vault /></AuthLayoutWrapper>} />
       <Route path="/help" element={<Help />} />
      <Route path="/collections" element={<AuthLayoutWrapper><LabsGuard feature="collections"><Collections /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/collections/:tab" element={<AuthLayoutWrapper><LabsGuard feature="collections"><Collections /></LabsGuard></AuthLayoutWrapper>} />
      {/* Backward compatibility */}
      <Route path="/archive" element={<AuthLayoutWrapper><LabsGuard feature="collections"><Collections /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/recipes/new" element={<AuthLayoutWrapper><LabsGuard feature="collections"><RecipeWizard /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/recipes/:id" element={<AuthLayoutWrapper><LabsGuard feature="collections"><RecipeDetail /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/recipes/:id/edit" element={<AuthLayoutWrapper><LabsGuard feature="collections"><RecipeEdit /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/recipes/:id/cook" element={<AuthLayoutWrapper><LabsGuard feature="collections"><CookMode /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/objects/new" element={<AuthLayoutWrapper><LabsGuard feature="collections"><ObjectsNew /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/things/:id" element={<AuthLayoutWrapper><LabsGuard feature="collections"><ThingDetail /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/things/:id/edit" element={<AuthLayoutWrapper><LabsGuard feature="collections"><ThingEdit /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/properties" element={<AuthLayoutWrapper><LabsGuard feature="collections"><Properties /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/properties/new" element={<AuthLayoutWrapper><LabsGuard feature="collections"><PropertyNew /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/properties/:id/edit" element={<AuthLayoutWrapper><LabsGuard feature="collections"><LazyRoute factory={() => import('./pages/PropertyEdit')} /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/properties/:id" element={<AuthLayoutWrapper><LabsGuard feature="collections"><PropertyDetail /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/pets" element={<AuthLayoutWrapper><LabsGuard feature="collections"><LazyRoute factory={() => import('./pages/Pets')} /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/pets/new" element={<AuthLayoutWrapper><LabsGuard feature="collections"><PetNew /></LabsGuard></AuthLayoutWrapper>} />
      <Route path="/pets/:id" element={<AuthLayoutWrapper><LabsGuard feature="collections"><LazyRoute factory={() => import('./pages/PetDetail')} /></LabsGuard></AuthLayoutWrapper>} />
       <Route path="/pets/:id/edit" element={<AuthLayoutWrapper><LabsGuard feature="collections"><PetEdit /></LabsGuard></AuthLayoutWrapper>} />
       <Route path="/capture" element={<AuthLayoutWrapper><Capture /></AuthLayoutWrapper>} />
       <Route path="/media" element={<AuthLayoutWrapper><Media /></AuthLayoutWrapper>} />
       <Route path="/media/albums" element={<AuthLayoutWrapper><Media /></AuthLayoutWrapper>} />
        <Route path="/search" element={<AuthLayoutWrapper><SearchPage /></AuthLayoutWrapper>} />
       <Route path="/digest/pause" element={<LazyRoute factory={() => import('./pages/DigestPause')} />} />
       <Route path="/invite/:token" element={<InviteRedeem />} />
      
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
           <Route path="duplicates" element={<AdminDuplicates />} />
           <Route path="safebox-waitlist" element={<AdminSafeBoxWaitlist />} />
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