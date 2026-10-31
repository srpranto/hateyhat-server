import { MongoClient, type Db, type Collection } from "mongodb";
import { env } from "./env.js";
import type { EventDocument, JoinedEventDocument } from "./types.js";

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

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
