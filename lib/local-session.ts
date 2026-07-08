"use client";

const ACCESS_TOKEN_KEY = "ai_shaofeng_access_token";
const REFRESH_TOKEN_KEY = "ai_shaofeng_refresh_token";

export type LocalSession = {
  access_token: string;
  refresh_token?: string;
};

export function saveLocalSession(session: LocalSession) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  if (session.refresh_token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  }
}

export function getLocalAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearLocalSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
