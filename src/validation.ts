import { EVENT_TYPES, type EventFormErrors, type EventInput, type EventType } from "./types.js";
import { isAfterDhakaToday, isValidDateFormat } from "./date.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidObjectIdString(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function isValidUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value);
}

export interface EventValidationResult {
  isValid: boolean;
  errors: EventFormErrors;
  data?: EventInput;
}

export function validateEventInput(
  raw: unknown,
  isUpdate = false,
  existingDate?: string
): EventValidationResult {
  const errors: EventFormErrors = {};

  if (!isRecord(raw)) {
    return {
      isValid: false,
      errors: {
        title: "Invalid request payload.",
      },
    };
  }

  const rawTitle = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!rawTitle) {
    errors.title = "Title is required.";
  } else if (rawTitle.length < 5) {
    errors.title = "Title must be at least 5 characters.";
  } else if (rawTitle.length > 100) {
    errors.title = "Title must not exceed 100 characters.";
  }

  const rawDescription = typeof raw.description === "string" ? raw.description.trim() : "";
  if (!rawDescription) {
    errors.description = "Description is required.";
  } else if (rawDescription.length < 20) {
    errors.description = "Description must be at least 20 characters.";
  } else if (rawDescription.length > 1000) {
    errors.description = "Description must not exceed 1000 characters.";
  }

  const rawType = typeof raw.eventType === "string" ? raw.eventType : "";
  let validEventType: EventType = "Other";
  if (!isEventType(rawType)) {
    errors.eventType = "Please select a valid event type.";
  } else {
    validEventType = rawType;
  }

  const rawThumbnail = typeof raw.thumbnail === "string" ? raw.thumbnail.trim() : "";
  if (!rawThumbnail) {
    errors.thumbnail = "Thumbnail URL is required.";
  } else if (!isValidUrl(rawThumbnail)) {
    errors.thumbnail = "Thumbnail must be a valid HTTP or HTTPS URL.";
  }

  const rawLocation = typeof raw.location === "string" ? raw.location.trim() : "";
  if (!rawLocation) {
    errors.location = "Location is required.";
  } else if (rawLocation.length < 3) {
    errors.location = "Location must be at least 3 characters.";
  } else if (rawLocation.length > 120) {
    errors.location = "Location must not exceed 120 characters.";
  }

  const rawDate = typeof raw.eventDate === "string" ? raw.eventDate.trim() : "";
  if (!rawDate) {
    errors.eventDate = "Event date is required.";
  } else if (!isValidDateFormat(rawDate)) {
    errors.eventDate = "Event date must be a valid date in YYYY-MM-DD format.";
  } else if ((!isUpdate || rawDate !== existingDate) && !isAfterDhakaToday(rawDate)) {
    errors.eventDate = "Event date must be after today.";
  }

  const hasErrors =
    Boolean(errors.title) ||
    Boolean(errors.description) ||
    Boolean(errors.eventType) ||
    Boolean(errors.thumbnail) ||
    Boolean(errors.location) ||
    Boolean(errors.eventDate);

  if (hasErrors) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: {},
    data: {
      title: rawTitle,
      description: rawDescription,
      eventType: validEventType,
      thumbnail: rawThumbnail,
      location: rawLocation,
      eventDate: rawDate,
    },
  };
}
