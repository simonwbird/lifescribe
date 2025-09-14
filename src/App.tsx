import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
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
import FamilyTreeV2 from "./pages/FamilyTreeV2";
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
import NotFound from "./pages/NotFound";

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
      <Route path="/home" element={<AuthGate><Home /></AuthGate>} />
      {/* Redirect /feed to /home */}
      <Route path="/feed" element={<Navigate to="/home" replace />} />
      <Route path="/stories/new" element={<AuthGate><NewStory /></AuthGate>} />
      <Route path="/stories/:id" element={<AuthGate><StoryDetail /></AuthGate>} />
      <Route path="/stories/:id/edit" element={<AuthGate><StoryEdit /></AuthGate>} />
      <Route path="/prompts" element={<AuthGate><Prompts /></AuthGate>} />
      <Route path="/prompts/browse" element={<AuthGate><PromptsBrowse /></AuthGate>} />
      <Route path="/family/members" element={<AuthGate><FamilyMembers /></AuthGate>} />
      <Route path="/family/tree" element={<AuthGate><FamilyTreeV2 /></AuthGate>} />
      <Route path="/family-tree/explorer" element={<AuthGate><FamilyTreeExplorer /></AuthGate>} />
      <Route path="/family-tree/fan" element={<AuthGate><FamilyTreeFan /></AuthGate>} />
      <Route path="/people/:id" element={<AuthGate><PersonProfile /></AuthGate>} />
      <Route path="/people/:id/timeline" element={<AuthGate><PersonTimeline /></AuthGate>} />
      <Route path="/profile" element={<AuthGate><Profile /></AuthGate>} />
      <Route path="/collections" element={<AuthGate><Collections /></AuthGate>} />
      <Route path="/collections/:tab" element={<AuthGate><Collections /></AuthGate>} />
      {/* Backward compatibility */}
      <Route path="/archive" element={<AuthGate><Collections /></AuthGate>} />
      <Route path="/recipes/new" element={<AuthGate><RecipeWizard /></AuthGate>} />
      <Route path="/recipes/:id" element={<AuthGate><RecipeDetail /></AuthGate>} />
      <Route path="/recipes/:id/edit" element={<AuthGate><RecipeEdit /></AuthGate>} />
      <Route path="/recipes/:id/cook" element={<AuthGate><CookMode /></AuthGate>} />
      <Route path="/objects/new" element={<AuthGate><ObjectsNew /></AuthGate>} />
      <Route path="/things/:id" element={<AuthGate><ThingDetail /></AuthGate>} />
      <Route path="/things/:id/edit" element={<AuthGate><ThingEdit /></AuthGate>} />
      <Route path="/properties/new" element={<AuthGate><PropertyNew /></AuthGate>} />
      <Route path="/properties/:id/edit" element={<AuthGate><PropertyEdit /></AuthGate>} />
      <Route path="/properties/:id" element={<AuthGate><PropertyDetail /></AuthGate>} />
      <Route path="/pets/new" element={<AuthGate><PetNew /></AuthGate>} />
      <Route path="/pets/:id" element={<AuthGate><PetDetail /></AuthGate>} />
       <Route path="/pets/:id/edit" element={<AuthGate><PetEdit /></AuthGate>} />
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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;