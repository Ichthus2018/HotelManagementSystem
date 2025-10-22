import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../services/supabaseClient";

// 1. Create a new, more specific context for the session
export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  // 2. State now holds the Supabase `Session` object and an initial loading state
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 3. Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 4. Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Set loading to false once we have a session or know there isn't one.
        if (isLoading) setIsLoading(false);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [isLoading]); // Rerun effect if loading state changes (edge case, but safe)

  // 5. Provide the session, loading state, and the supabase client itself
  const value = {
    session,
    isLoading,
    supabase,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

// 6. A simple hook to consume the session context
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
