"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Checks on mount whether the session should persist.
 * If "lt-remember" is not in localStorage, sign out any active session —
 * this handles the case where remember-me was unchecked but the cookie
 * still has a 30-day maxAge.
 */
export default function SessionGuard() {
  useEffect(() => {
    const remembered = localStorage.getItem("lt-remember");
    if (remembered) return; // user checked remember me — do nothing

    // Not remembered: if there's a session, sign out
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase.auth.signOut().then(() => {
          window.location.href = "/login";
        });
      }
    });
  }, []);

  return null;
}
