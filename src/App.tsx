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

const queryClient = new QueryClient();

function AppContent() {
  // Apply mobile optimizations globally
  useMobileOptimizations()
  const location = useLocation();
  
  // Routes that should not show the header
  const noHeaderRoutes = [
    '/login', '/landing', '/auth/login', '/auth/signup', 
    '/auth/verify', '/auth/reset', '/privacy', '/terms'
  ];
  const shouldShowHeader = !noHeaderRoutes.some(route => location.pathname.startsWith(route));
  
  return (
    <FocusManager>
      {/* Skip links for keyboard navigation */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      {/* Global Header */}
      {shouldShowHeader && <LifeScribeHeader />}
      
      <Routes>
      {/* Public routes */}
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
       <Route path="/home-v2" element={<AuthGate><HomeV2 /></AuthGate>} />
        <Route path="/prompts/wow" element={<AuthGate><PromptsWow /></AuthGate>} />
        
        {/* Me redirect to person page */}
        <Route path="/me" element={<AuthGate><MeRedirect /></AuthGate>} />
        
        {/* Redirect /feed to /home */}
      <Route path="/feed" element={<Navigate to="/home" replace />} />
      
      {/* Story routes with legacy redirect */}
      <Route path="/simple/story/new" element={<Navigate to="/stories/new" replace />} />
      <Route path="/stories/new-tabbed" element={<AuthGate><StoryNew /></AuthGate>} />
      <Route path="/stories/new" element={<AuthGate><NewStory /></AuthGate>} />
      <Route path="/stories/drafts" element={<AuthGate><DraftsPage /></AuthGate>} />
      <Route path="/stories/:id" element={<AuthGate><StoryDetail /></AuthGate>} />
      <Route path="/stories/:id/edit" element={<AuthGate><StoryEdit /></AuthGate>} />
      <Route path="/prompts" element={<AuthGate><Prompts /></AuthGate>} />
      <Route path="/prompts/simple" element={<AuthGate><PromptsSimple /></AuthGate>} />
      <Route path="/prompts/hub" element={<AuthGate><PromptHub /></AuthGate>} />
      <Route path="/prompts/browse" element={<AuthGate><PromptsBrowse /></AuthGate>} />
      <Route path="/sharing" element={<AuthGate><SharingPermissions /></AuthGate>} />
      <Route path="/family/tree" element={<AuthGate><FamilyTree /></AuthGate>} />
      <Route path="/family-tree/explorer" element={<AuthGate><LabsGuard feature="alternateTreeViews"><FamilyTreeExplorer /></LabsGuard></AuthGate>} />
      <Route path="/family-tree/fan" element={<AuthGate><LabsGuard feature="alternateTreeViews"><FamilyTreeFan /></LabsGuard></AuthGate>} />
      <Route path="/people" element={<AuthGate><People /></AuthGate>} />
      <Route path="/people/:id" element={<AuthGate><PersonPage /></AuthGate>} />
      <Route path="/people/:personId/moderation" element={<AuthGate><ModerationQueue /></AuthGate>} />
      <Route path="/people/:id/legacy" element={<AuthGate><PersonProfile /></AuthGate>} />
      <Route path="/people/:id/timeline" element={<AuthGate><PersonTimeline /></AuthGate>} />
      <Route path="/analytics" element={<AuthGate><AnalyticsPage /></AuthGate>} />
      <Route path="/analytics/stories" element={<AuthGate><StoryAnalytics /></AuthGate>} />
       <Route path="/profile" element={<AuthGate><Profile /></AuthGate>} />
       <Route path="/profile/debug" element={<AuthGate><ProfileDebug /></AuthGate>} />
       <Route path="/settings" element={<AuthGate><Settings /></AuthGate>} />
       <Route path="/help" element={<AuthGate><Help /></AuthGate>} />
       <Route path="/inbox" element={<AuthGate><Inbox /></AuthGate>} />
       <Route path="/compose/voice" element={<AuthGate><ComposeVoice /></AuthGate>} />
       <Route path="/compose/text" element={<AuthGate><ComposeText /></AuthGate>} />
       <Route path="/compose/photos" element={<AuthGate><ComposePhotos /></AuthGate>} />
       <Route path="/compose/scan" element={<AuthGate><ComposeScan /></AuthGate>} />
       <Route path="/compose/video" element={<AuthGate><ComposeVideo /></AuthGate>} />
       <Route path="/compose/mixed" element={<AuthGate><ComposeMixed /></AuthGate>} />
       <Route path="/notes/new" element={<AuthGate><NoteNew /></AuthGate>} />
       <Route path="/events" element={<AuthGate><Events /></AuthGate>} />
       <Route path="/event/:eventId" element={<AuthGate><EventDetail /></AuthGate>} />
       <Route path="/event/:eventId/upload" element={<EventUploadPage />} />
       <Route path="/print" element={<AuthGate><PrintComposer /></AuthGate>} />
       <Route path="/print/event/:eventId" element={<AuthGate><PrintComposer /></AuthGate>} />
       <Route path="/admin/duplicates" element={<AuthGate><DuplicatesPage /></AuthGate>} />
       <Route path="/safebox" element={<AuthGate><SafeBox /></AuthGate>} />
       <Route path="/tribute/:id" element={<AuthGate><TributeDetail /></AuthGate>} />
       <Route path="/labs" element={<AuthGate><Labs /></AuthGate>} />
       <Route path="/labs/spaces" element={<AuthGate><LabsGuard feature="multiSpaces"><LabsSpaces /></LabsGuard></AuthGate>} />
       <Route path="/portfolio" element={<AuthGate><Portfolio /></AuthGate>} />
       <Route path="/vault" element={<AuthGate><Vault /></AuthGate>} />
       <Route path="/help" element={<Help />} />
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
      <Route path="/properties" element={<AuthGate><LabsGuard feature="collections"><Properties /></LabsGuard></AuthGate>} />
      <Route path="/properties/:id" element={<AuthGate><LabsGuard feature="collections"><PropertyDetail /></LabsGuard></AuthGate>} />
      <Route path="/pets" element={<AuthGate><LabsGuard feature="collections"><LazyRoute factory={() => import('./pages/Pets')} /></LabsGuard></AuthGate>} />
      <Route path="/pets/new" element={<AuthGate><LabsGuard feature="collections"><PetNew /></LabsGuard></AuthGate>} />
      <Route path="/pets/:id" element={<AuthGate><LabsGuard feature="collections"><LazyRoute factory={() => import('./pages/PetDetail')} /></LabsGuard></AuthGate>} />
       <Route path="/pets/:id/edit" element={<AuthGate><LabsGuard feature="collections"><PetEdit /></LabsGuard></AuthGate>} />
       <Route path="/capture" element={<AuthGate><Capture /></AuthGate>} />
       <Route path="/media" element={<AuthGate><Media /></AuthGate>} />
       <Route path="/media/albums" element={<AuthGate><Media /></AuthGate>} />
        <Route path="/search" element={<AuthGate><SearchPage /></AuthGate>} />
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