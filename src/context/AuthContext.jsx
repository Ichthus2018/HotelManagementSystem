import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../services/supabaseClient";

export const AuthContext = createContext(); // <-- FIXED

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) await fetchUser(session.user.id);
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) fetchUser(session.user.id);
        else setUser(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchUser = async (id) => {
    try {
      const { data, error, status } = await supabase
        .from("users")
        .select("id, email, admin, role")
        .eq("id", id)
        .single();

      if (error && status !== 406) {
        // 406 is a normal error when .single() finds no rows
        console.error("Error fetching user:", error);
        throw error;
      }

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error(
        "An exception occurred while fetching the user:",
        error.message
      );
      // Set user to null if there's an error so the app doesn't get stuck
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
