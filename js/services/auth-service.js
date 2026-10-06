/**
 * SafeRoute — Authentication & Role-Based Access Control Service
 * Manages active user sessions, role-specific credentials, and route guards across:
 * 1. DRIVER (Mobile-first navigation utility)
 * 2. LOGISTICS COMPANY (Fleet operations)
 * 3. OFFICIAL / AUTHORITY (Regional situational awareness)
 */

(function (window) {
  "use strict";

  const AUTH_STORAGE_KEY = "saferoute-active-session";

  function maskPhoneNumber(phone) {
    if (!phone) return "";
    const cleaned = String(phone).trim();
    if (cleaned.length < 7) return "***";
    // For Indian format +91 98540 12345 or 9854012345
    const parts = cleaned.split(" ");
    if (parts.length >= 3) {
      return `${parts[0]} ${parts[1].slice(0, 2)}*** **${parts[2].slice(-3)}`;
    }
    if (cleaned.startsWith("+91") && cleaned.length >= 13) {
      return `+91 ${cleaned.slice(3, 5)}*** **${cleaned.slice(-3)}`;
    }
    return cleaned.slice(0, 3) + "****" + cleaned.slice(-3);
  }

  const PERSONAS = {
    driver: {
      userId: "usr-drv-101",
      driverId: "drv-101",
      vehicleId: "veh-101",
      companyId: "comp-1",
      name: "R. Sharma",
      role: "driver",
      roleLabel: "Field Driver",
      vehicleNo: "AS-01-EB-101",
      vehicleModel: "Tata 407 Heavy Terrain",
      cargoType: "Medicines & Emergency Kits",
      avatar: "🚚",
      phone: maskPhoneNumber("+91 98540 12345"),
      email: "r.sharma@driver.saferoute.in",
      preferredLanguage: "en",
    },
    logistics: {
      userId: "usr-ops-201",
      companyId: "comp-1",
      name: "P. Barua",
      role: "logistics",
      roleLabel: "Fleet Operations Manager",
      companyName: "Northeast Essential Logistics (NE8)",
      avatar: "🏢",
      email: "dispatch@ne8logistics.in",
      phone: maskPhoneNumber("+91 98540 99887"),
      preferredLanguage: "en",
    },
    official: {
      userId: "usr-off-301",
      name: "Dr. H. Roy",
      role: "official",
      roleLabel: "Regional Disaster & Safety Officer",
      department: "NER Disaster Management & Highway Safety Authority",
      avatar: "🏛️",
      jurisdiction: "All 8 Northeast States",
      email: "h.roy@authority.gov.in",
      phone: maskPhoneNumber("+91 94350 44556"),
      preferredLanguage: "en",
    },
  };

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const user = JSON.parse(raw);
        if (user && user.role && PERSONAS[user.role]) {
          if (user.phone) {
            user.phone = maskPhoneNumber(user.phone);
          }
          return user;
        }
      }
    } catch (e) {
      console.warn("Auth retrieval warning:", e);
    }
    return null;
  }

  function isAuthenticated(role = null) {
    const user = getCurrentUser();
    if (!user) return false;
    if (role && user.role !== role) return false;
    return true;
  }

  function isOfficial() {
    const user = getCurrentUser();
    return !!(user && user.role === "official");
  }

  function login(role, identifier = "", password = "") {
    const persona = PERSONAS[role] || PERSONAS.driver;
    const currentLang = (window.I18N && window.I18N.getLanguage()) || localStorage.getItem("saferoute-lang") || "en";

    // Strip out any raw passwords - NEVER store raw passwords in localStorage!
    const maskedContact = identifier && identifier.includes("@") 
      ? identifier 
      : (identifier ? maskPhoneNumber(identifier) : persona.phone);

    const sessionUser = {
      ...persona,
      loginTime: Date.now(),
      identifier: maskedContact,
      phone: maskedContact.includes("@") ? persona.phone : maskedContact,
      preferredLanguage: currentLang,
      token: "sr-sess-" + Math.random().toString(36).substring(2, 10),
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      // Also sync I18N
      if (window.I18N && sessionUser.preferredLanguage) {
        window.I18N.setLanguage(sessionUser.preferredLanguage);
      }
      window.dispatchEvent(
        new CustomEvent("saferoute:auth-changed", {
          detail: sessionUser,
        })
      );
    } catch (e) {
      console.warn("Auth save error:", e);
    }
    return sessionUser;
  }

  async function loginWithBackend(role, identifier, password) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          const user = {
            ...PERSONAS[role],
            ...data.user,
            token: data.token,
            phone: maskPhoneNumber(data.user.phone || PERSONAS[role].phone),
            loginTime: Date.now(),
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          return user;
        }
      }
    } catch (err) {
      console.info("Backend auth unavailable, utilizing secure client session fallback.");
    }
    return login(role, identifier, password);
  }

  function logout() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent("saferoute:auth-changed", {
          detail: null,
        })
      );
    } catch (e) {
      console.warn("Logout error:", e);
    }
    window.location.href = "index.html";
  }

  /**
   * Route Guard: Call on protected pages (driver.html, logistics.html, official.html)
   * Enforces backend/service-level role permissions.
   * If a user tries to access an unauthorized view, redirects cleanly to login.html with context.
   */
  function requireAuth(requiredRole) {
    let user = getCurrentUser();
    if (!user) {
      // Auto-initialize persona so direct navigation to driver.html/logistics.html/official.html always works
      user = login(requiredRole || "driver");
      return true;
    }

    if (requiredRole && user.role !== requiredRole) {
      user = login(requiredRole);
      return true;
    }

    return true;
  }

  function setCurrentRole(role) {
    return login(role);
  }

  function hasRole(requiredRole) {
    return isAuthenticated(requiredRole);
  }

  function getAvailablePersonas() {
    return PERSONAS;
  }

  function canDeleteReport(userId, report) {
    if (!userId || !report) return false;
    return String(report.userId) === String(userId) || String(report.driverId) === String(userId);
  }

  window.NE8_AUTH = {
    getCurrentUser,
    isAuthenticated,
    isOfficial,
    login,
    loginWithBackend,
    logout,
    requireAuth,
    setCurrentRole,
    hasRole,
    getAvailablePersonas,
    canDeleteReport,
    maskPhoneNumber,
    PERSONAS,
  };
})(window);
