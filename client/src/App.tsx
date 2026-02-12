import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./main";
import { Toaster } from "@/components/ui/sonner";
import { useUser } from "@/lib/useUser";
import { Loader2 } from "lucide-react";
import React, { Suspense, useEffect } from "react";
import LoadingScreen from "@/components/LoadingScreen";

// Lazy load pages
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Login = React.lazy(() => import("@/pages/Login"));
const Register = React.lazy(() => import("@/pages/Register"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const GuildPage = React.lazy(() => import("@/pages/GuildPage"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

function Router() {
  const { user, isLoading } = useUser();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirect to login if trying to access protected routes
    if (location !== "/login" && location !== "/register" && !location.startsWith("/auth/")) {
      // Only redirect if not already on a public page to avoid loops/flashes
      // But wouter Switch handles this naturally by matching routes.
      // The issue is 404 falling through.
    }

    return (
      <Suspense fallback={<LoadingScreen />}>
        <Switch>
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
          {/* Catch-all for unauthenticated users -> Login */}
          <Route component={Login} />
        </Switch>
      </Suspense>
    );
  }

  // Redirect to dashboard if authenticated user tries to access login/register
  if (user && (location === "/login" || location === "/register")) {
    setLocation("/dashboard");
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile" component={Profile} />
        <Route path="/guild">
          <GuildPage />
        </Route>
        <Route path="/guild/invite/:code">
          {(params) => <GuildPage inviteCode={params.code} />}
        </Route>
        <Route path="/" component={Dashboard} />
        {/* If user is authenticated but route not found, redirect to dashboard ? or Show NotFound */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
