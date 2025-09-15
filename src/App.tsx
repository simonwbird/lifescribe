import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import { ModeProvider } from "@/contexts/ModeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import AuthGate from "./components/AuthGate";
import NewStory from "./pages/NewStory";
import StoryDetail from "./pages/StoryDetail";
import Prompts from "./pages/Prompts";
import PromptsBrowse from "./pages/PromptsBrowse";
import FamilyMembers from "./pages/FamilyMembers";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import FamilyTree from "./pages/FamilyTree";
import FamilyTreeExplorer from "./pages/FamilyTreeExplorer";
import FamilyTreeFan from "./pages/FamilyTreeFan";
import PersonProfile from "./pages/PersonProfile";
import Collections from "./pages/Collections";
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
import SearchPage from "./pages/Search";
import Capture from "./pages/Capture";
import Media from "./pages/Media";
import Labs from "./pages/Labs";
import LabsSpaces from "./pages/LabsSpaces";
import LabsGuard from "./components/navigation/LabsGuard";
import NotFound from "./pages/NotFound";
import InviteLanding from "./pages/InviteLanding";
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

const queryClient = new QueryClient();

function AppContent() {
  // Apply mobile optimizations globally
  useMobileOptimizations()
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
       <Route path="/invite/:token" element={<InviteLanding />} />
       <Route path="/privacy" element={<Privacy />} />
       <Route path="/terms" element={<Terms />} />
       <Route path="/home" element={<AuthGate><Home /></AuthGate>} />
      {/* Redirect /feed to /home */}
      <Route path="/feed" element={<Navigate to="/home" replace />} />
      <Route path="/stories/new" element={<AuthGate><NewStory /></AuthGate>} />
      <Route path="/stories/:id" element={<AuthGate><StoryDetail /></AuthGate>} />
      <Route path="/stories/:id/edit" element={<AuthGate><StoryEdit /></AuthGate>} />
      <Route path="/prompts" element={<AuthGate><Prompts /></AuthGate>} />
      <Route path="/prompts/browse" element={<AuthGate><PromptsBrowse /></AuthGate>} />
      <Route path="/family/members" element={<AuthGate><FamilyMembers /></AuthGate>} />
      <Route path="/family/tree" element={<AuthGate><FamilyTree /></AuthGate>} />
      <Route path="/family-tree/explorer" element={<AuthGate><LabsGuard feature="alternateTreeViews"><FamilyTreeExplorer /></LabsGuard></AuthGate>} />
      <Route path="/family-tree/fan" element={<AuthGate><LabsGuard feature="alternateTreeViews"><FamilyTreeFan /></LabsGuard></AuthGate>} />
      <Route path="/people/:id" element={<AuthGate><PersonProfile /></AuthGate>} />
      <Route path="/people/:id/timeline" element={<AuthGate><PersonTimeline /></AuthGate>} />
      <Route path="/profile" element={<AuthGate><Profile /></AuthGate>} />
      <Route path="/settings" element={<AuthGate><Settings /></AuthGate>} />
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
       <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;