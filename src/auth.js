import { client, neonEnabled } from './neon.js';

export const authEnabled = neonEnabled;

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
  if (!client) throw new Error('Auth not configured');
  const result = await client.auth.signIn.email({ email, password });
  if (result.error) throw new Error(result.error.message || 'Sign-in failed');
  await refreshSession();
  return currentSession;
}

export async function signUp(email, password, name) {
  if (!client) throw new Error('Auth not configured');
  const result = await client.auth.signUp.email({ email, password, name });
  if (result.error) throw new Error(result.error.message || 'Sign-up failed');
  await refreshSession();
  return currentSession;
}

export async function signInWithGoogle() {
  if (!client) throw new Error('Auth not configured');
  await client.auth.signIn.social({
    provider: 'google',
    callbackURL: window.location.origin + window.location.pathname,
  });
}

export async function signOut() {
  if (!client) return;
  await client.auth.signOut();
  currentSession = null;
  notifyListeners();
}

export async function refreshSession() {
  if (!client) return null;
  try {
    const result = await client.auth.getSession();
    currentSession = result.data || null;
  } catch {
    currentSession = null;
  }
  notifyListeners();
  return currentSession;
}

// Initialize session on load (check if user has an existing session)
export async function initAuth() {
  if (!client) return null;
  return refreshSession();
}
