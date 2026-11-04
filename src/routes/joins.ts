import { Router, type Request, type Response, type NextFunction } from "express";
import { ObjectId } from "mongodb";
import { getEventsCollection, getJoinedEventsCollection } from "../db.js";
import { isUpcomingDhakaDate } from "../date.js";
import { isValidObjectIdString } from "../validation.js";
import { verifyToken } from "../middleware/verify-token.js";
import type { AuthLocals, JoinedEventDocument } from "../types.js";

export const joinsRouter = Router();

joinsRouter.post("/events/:id/join", verifyToken, async (req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : "";
    if (!id || !isValidObjectIdString(id)) {
      res.status(400).json({ message: "Invalid event ID format." });
      return;
    }

    const eventsCol = await getEventsCollection();
    const event = await eventsCol.findOne({ _id: new ObjectId(id) });
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (!isUpcomingDhakaDate(event.eventDate)) {
      res.status(400).json({ message: "Cannot join an event that has already passed." });
      return;
    }

    const joinedCol = await getJoinedEventsCollection();
    const existingJoin = await joinedCol.findOne({
      eventId: event._id,
      userEmail: res.locals.userEmail,
    });

    if (existingJoin) {
      res.status(409).json({ message: "You have already joined this event." });
      return;
    }

    const joinId = new ObjectId();
    const doc: JoinedEventDocument = {
      _id: joinId,
      eventId: event._id,
      eventTitle: event.title,
      userEmail: res.locals.userEmail,
      ...(res.locals.userName ? { userName: res.locals.userName } : {}),
      joinedAt: new Date().toISOString(),
    };

    try {
      await joinedCol.insertOne(doc);
      res.status(201).json({ message: "Successfully joined the event." });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        res.status(409).json({ message: "You have already joined this event." });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

joinsRouter.get(["/joined-events", "/joined_events", "/joinedevents"], verifyToken, async (_req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): Promise<void> => {
  try {
    const joinedCol = await getJoinedEventsCollection();
    const joins = await joinedCol.find({ userEmail: res.locals.userEmail }).toArray();

    if (joins.length === 0) {
      res.status(200).json([]);
      return;
    }

    const eventIds = joins.map((j) => j.eventId);
    const eventsCol = await getEventsCollection();
    const events = await eventsCol
      .find({ _id: { $in: eventIds } })
      .sort({ eventDate: 1 })
      .toArray();

    res.status(200).json(events);
  } catch (error) {
    next(error);
  }
});

joinsRouter.delete("/events/:id/join", verifyToken, async (req: Request, res: Response<unknown, AuthLocals>, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = typeof rawId === "string" ? rawId : "";
    if (!id || !isValidObjectIdString(id)) {
      res.status(400).json({ message: "Invalid event ID format." });
      return;
    }

    const eventsCol = await getEventsCollection();
    const event = await eventsCol.findOne({ _id: new ObjectId(id) });
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    const joinedCol = await getJoinedEventsCollection();
    const result = await joinedCol.deleteOne({
      eventId: event._id,
      userEmail: res.locals.userEmail,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "You have not joined this event." });
      return;
    }

    res.status(200).json({ message: "RSVP cancelled successfully." });
  } catch (error) {
    next(error);
  }
});
