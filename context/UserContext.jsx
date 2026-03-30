"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  getFirebaseAccessToken,
  subscribeToAuthChanges,
} from "@/lib/auth-client";
import { getBillingProfile } from "@/lib/billing-storage";
import {
  ensureUserProfile as ensureClientUserProfile,
  getUserProfile,
} from "@/lib/user-storage";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncFirebasePlan = async () => {
    const accessToken = await getFirebaseAccessToken();

    if (!accessToken) {
      return null;
    }

    const response = await fetch("/api/billing/sync-plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error || "Failed to sync billing plan.");
    }

    return payload?.profile || null;
  };

  const mergeBillingPlan = async (profile) => {
    if (!profile?.id) {
      return profile;
    }

    try {
      const billingProfile = await getBillingProfile(profile.id);

      if (billingProfile?.plan === "pro" || billingProfile?.plan === "premium") {
        if (profile.plan !== billingProfile.plan) {
          try {
            const syncedProfile = await syncFirebasePlan();

            if (syncedProfile) {
              return syncedProfile;
            }
          } catch (syncError) {
            console.log("Billing sync error:", syncError);
          }
        }

        return {
          ...profile,
          plan: billingProfile.plan,
        };
      }
    } catch (billingError) {
      console.log("Billing profile read error:", billingError);
    }

    return profile;
  };

  useEffect(() => {
    let active = true;

    const hydrateUser = async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        if (active) {
          setUserData(null);
          setLoading(false);
        }
        return;
      }

      try {
        const profile =
          (await getUserProfile(currentUser.uid)) ||
          (await ensureClientUserProfile(currentUser));
        const mergedProfile = await mergeBillingPlan(profile);

        if (active) {
          setUserData(mergedProfile);
        }
      } catch (error) {
        console.log("User profile load error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrateUser(auth.currentUser);

    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      await hydrateUser(currentUser);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, userData, loading, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
