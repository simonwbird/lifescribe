import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import NewStory from "./pages/NewStory";
import StoryDetail from "./pages/StoryDetail";
import Prompts from "./pages/Prompts";
import PromptsBrowse from "./pages/PromptsBrowse";
import FamilyMembers from "./pages/FamilyMembers";
import Profile from "./pages/Profile";
import FamilyTree from "./pages/FamilyTree";
import PersonProfile from "./pages/PersonProfile";
import Collections from "./pages/Collections";
import { PersonTimeline } from "./pages/PersonTimeline";
import RecipeWizard from "./components/recipe/RecipeWizard";
import ObjectsNew from "./pages/ObjectsNew";
import RecipeDetail from "./pages/RecipeDetail";
import CookMode from "./pages/CookMode";
import ThingDetail from "./pages/ThingDetail";
import PropertyDetail from "./pages/PropertyDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/stories/new" element={<NewStory />} />
          <Route path="/stories/:id" element={<StoryDetail />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/prompts/browse" element={<PromptsBrowse />} />
          <Route path="/family/members" element={<FamilyMembers />} />
          <Route path="/family/tree" element={<FamilyTree />} />
          <Route path="/people/:id" element={<PersonProfile />} />
          <Route path="/people/:id/timeline" element={<PersonTimeline />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:tab" element={<Collections />} />
          {/* Backward compatibility */}
          <Route path="/archive" element={<Collections />} />
          <Route path="/recipes/new" element={<RecipeWizard />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/recipes/:id/cook" element={<CookMode />} />
          <Route path="/objects/new" element={<ObjectsNew />} />
          <Route path="/things/:id" element={<ThingDetail />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
