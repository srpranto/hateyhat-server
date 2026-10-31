import type { ObjectId } from "mongodb";

export const EVENT_TYPES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Food Distribution",
  "Blood Donation",
  "Health Camp",
  "Education",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface EventDocument {
  _id: ObjectId;
  title: string;
  description: string;
  location: string;
  thumbnail: string;
  eventType: EventType;
  eventDate: string;
  creatorEmail: string;
  createdAt: string;
}

export interface JoinedEventDocument {
  _id: ObjectId;
  eventId: ObjectId;
  eventTitle: string;
  userEmail: string;
  userName?: string;
  joinedAt: string;
}

export interface AuthLocals {
  userEmail: string;
  userName?: string;
}

export interface EventInput {
  title: string;
  description: string;
  location: string;
  thumbnail: string;
  eventType: EventType;
  eventDate: string;
}

export interface EventFormErrors {
  title?: string;
  description?: string;
  location?: string;
  thumbnail?: string;
  eventType?: string;
  eventDate?: string;
}
