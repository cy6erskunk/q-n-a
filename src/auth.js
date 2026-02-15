import { createAuthClient } from 'better-auth/client';

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;

// Auth is optional — if no URL is configured, all auth functions are no-ops
export const authEnabled = Boolean(AUTH_URL);

const authClient = authEnabled
  ? createAuthClient({ baseURL: AUTH_URL })
  : null;

// Current session state (null = not signed in, or auth not configured)
let currentSession = null;
let sessionListeners = [];

export function onSessionChange(listener) {
  sessionListeners.push(listener);
  return () => {
    sessionListeners = sessionListeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  sessionListeners.forEach(fn => fn(currentSession));
}

export function getSession() {
  return currentSession;
}

export function getToken() {
  return currentSession?.session?.token || null;
}

export function getUser() {
  return currentSession?.user || null;
}

export async function signIn(email, password) {
  if (!authClient) throw new Error('Auth not configured');
  const result = await authClient.signIn.email({ email, password });
  if (result.error) throw new Error(result.error.message || 'Sign-in failed');
  await refreshSession();
  return currentSession;
}

export async function signUp(email, password, name) {
  if (!authClient) throw new Error('Auth not configured');
  const result = await authClient.signUp.email({ email, password, name });
  if (result.error) throw new Error(result.error.message || 'Sign-up failed');
  await refreshSession();
  return currentSession;
}

export async function signOut() {
  if (!authClient) return;
  await authClient.signOut();
  currentSession = null;
  notifyListeners();
}

export async function refreshSession() {
  if (!authClient) return null;
  try {
    const result = await authClient.getSession();
    currentSession = result.data || null;
  } catch {
    currentSession = null;
  }
  notifyListeners();
  return currentSession;
}

// Initialize session on load (check if user has an existing session cookie)
export async function initAuth() {
  if (!authClient) return null;
  return refreshSession();
}
