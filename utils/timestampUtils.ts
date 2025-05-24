// Utilities for working with Firestore Timestamps in TypeScript

import { serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Creates a server timestamp for use in Firestore documents
 */
export function createServerTimestamp() {
  return serverTimestamp();
}

/**
 * Creates a client-side timestamp for use when server timestamp is not available
 */
export function createClientTimestamp() {
  return {
    toDate: () => new Date(),
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: (Date.now() % 1000) * 1000000
  };
}

/**
 * Converts a Date object to a Firestore-compatible timestamp
 */
export function dateToTimestamp(date: Date) {
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000
  };
}

/**
 * Converts a Firestore timestamp to a Date object
 */
export function timestampToDate(timestamp: any): Date {
  if (!timestamp) return new Date();
  
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  
  return new Date(timestamp);
}

/**
 * Formats a Firestore timestamp to a localized date string
 */
export function formatTimestamp(timestamp: any, locale = 'tr-TR'): string {
  const date = timestampToDate(timestamp);
  return date.toLocaleDateString(locale);
}

/**
 * Formats a Firestore timestamp to a localized date and time string
 */
export function formatTimestampWithTime(timestamp: any, locale = 'tr-TR'): string {
  const date = timestampToDate(timestamp);
  return date.toLocaleString(locale);
}
