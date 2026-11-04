import { MongoClient, type Db, type Collection } from "mongodb";
import { env } from "./env.js";
import type { EventDocument, JoinedEventDocument } from "./types.js";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let indexesEnsured = false;

export async function ensureIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  try {
    const eventsCol = db.collection<EventDocument>("events");
    const joinedCol = db.collection<JoinedEventDocument>("joinedEvents");

    await Promise.all([
      eventsCol.createIndex({ eventDate: 1 }),
      eventsCol.createIndex({ creatorEmail: 1, eventDate: 1 }),
      joinedCol.createIndex({ eventId: 1, userEmail: 1 }, { unique: true }),
      joinedCol.createIndex({ userEmail: 1, joinedAt: -1 }),
      joinedCol.createIndex({ eventId: 1 }),
    ]);
    indexesEnsured = true;
  } catch (err) {
    console.warn("MongoDB ensureIndexes note:", err);
  }
}

export async function getDb(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }
  if (!client) {
    const newClient = new MongoClient(env.MONGODB_URI);
    await newClient.connect();
    client = newClient;
  }
  dbInstance = client.db(env.MONGODB_DB_NAME);
  void ensureIndexes(dbInstance);
  return dbInstance;
}

export async function getEventsCollection(): Promise<Collection<EventDocument>> {
  const db = await getDb();
  return db.collection<EventDocument>("events");
}

export async function getJoinedEventsCollection(): Promise<Collection<JoinedEventDocument>> {
  const db = await getDb();
  return db.collection<JoinedEventDocument>("joinedEvents");
}
