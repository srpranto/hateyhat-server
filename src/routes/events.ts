import { Router, type Request, type Response, type NextFunction } from "express";
import { ObjectId } from "mongodb";
import { getEventsCollection, getJoinedEventsCollection } from "../db.js";
import { getDhakaToday } from "../date.js";
import { isValidObjectIdString, validateEventInput } from "../validation.js";
import { verifyToken } from "../middleware/verify-token.js";
import type { AuthLocals, EventDocument } from "../types.js";

export const eventsRouter = Router();

eventsRouter.get("/events", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let limitNum: number | undefined;
    if (req.query.limit !== undefined) {
      if (typeof req.query.limit !== "string") {
        res.status(400).json({ message: "Limit must be an integer between 1 and 50." });
        return;
      }
      const parsed = Number(req.query.limit);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
        res.status(400).json({ message: "Limit must be an integer between 1 and 50." });
        return;
      }
      limitNum = parsed;
    }

    const col = await getEventsCollection();
    const today = getDhakaToday();
    const cursor = col.find({ eventDate: { $gte: today } }).sort({ eventDate: 1 });
    if (limitNum !== undefined) {
      cursor.limit(limitNum);
    }
    const events = await cursor.toArray();
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/events/:id", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : "";
    if (!id || !isValidObjectIdString(id)) {
      res.status(400).json({ message: "Invalid event ID format." });
      return;
    }

    const col = await getEventsCollection();
    const event = await col.findOne({ _id: new ObjectId(id) });
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/events", verifyToken, async (req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): Promise<void> => {
  try {
    const validation = validateEventInput(req.body, false);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({ message: "Validation failed.", errors: validation.errors });
      return;
    }

    const col = await getEventsCollection();
    const id = new ObjectId();
    const doc: EventDocument = {
      _id: id,
      ...validation.data,
      creatorEmail: res.locals.userEmail,
      createdAt: new Date().toISOString(),
    };

    await col.insertOne(doc);
    res.status(201).json({
      message: "Event created successfully.",
      eventId: id.toString(),
    });
  } catch (error) {
    next(error);
  }
});

eventsRouter.get(["/my-events", "/my_events", "/myevents"], verifyToken, async (_req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): Promise<void> => {
  try {
    const col = await getEventsCollection();
    const events = await col
      .find({ creatorEmail: res.locals.userEmail })
      .sort({ eventDate: 1 })
      .toArray();
    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
});

eventsRouter.put("/events/:id", verifyToken, async (req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : "";
    if (!id || !isValidObjectIdString(id)) {
      res.status(400).json({ message: "Invalid event ID format." });
      return;
    }

    const col = await getEventsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (existing.creatorEmail !== res.locals.userEmail) {
      res.status(403).json({ message: "You are not authorized to edit this event." });
      return;
    }

    const validation = validateEventInput(req.body, true, existing.eventDate);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({ message: "Validation failed.", errors: validation.errors });
      return;
    }

    await col.updateOne({ _id: new ObjectId(id) }, { $set: validation.data });
    const joinedCol = await getJoinedEventsCollection();
    await joinedCol.updateMany(
      { eventId: new ObjectId(id) },
      { $set: { eventTitle: validation.data.title } }
    );
    const updated = await col.findOne({ _id: new ObjectId(id) });
    res.status(200).json({
      message: "Event updated successfully.",
      event: updated,
    });
  } catch (error) {
    next(error);
  }
});

eventsRouter.delete("/events/:id", verifyToken, async (req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : "";
    if (!id || !isValidObjectIdString(id)) {
      res.status(400).json({ message: "Invalid event ID format." });
      return;
    }

    const col = await getEventsCollection();
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (existing.creatorEmail !== res.locals.userEmail) {
      res.status(403).json({ message: "You are not authorized to delete this event." });
      return;
    }

    await col.deleteOne({ _id: new ObjectId(id) });
    const joinedCol = await getJoinedEventsCollection();
    await joinedCol.deleteMany({ eventId: new ObjectId(id) });
    res.status(200).json({
      message: "Event deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
});
