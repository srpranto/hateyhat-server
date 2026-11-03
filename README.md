# HateyHat Server

Backend REST API for **HateyHat**, a community platform where people in Dhaka can organize and join social service events like winter clothes drives, food sharing, cleanups, and tree plantation.

- **Live Server API**: https://hateyhat-server.vercel.app
- **Live Client Application**: https://hateyhat-client.vercel.app

---

## What It Does

This backend handles all the data storage and business logic for the platform:

- **Upcoming Events**: Delivers scheduled community events sorted by date, with support for limit queries (used for the 6-event section on the home page).
- **Event Creation**: Lets logged-in members post new events with future dates, location, category, and creator email.
- **Event Management**: Gives organizers full control to update or delete only the events they created.
- **Volunteering & Registrations**: Allows members to join events and keeps track of their joined activities.
- **Protected Routes**: Verifies user tokens using JWKS public keys so private actions are safe and authenticated.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB Atlas (native driver)
- **Authentication**: JWT token verification with JWKS
- **Deployment**: Vercel

---

## API Summary

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Server health check |
| `GET` | `/events` | Public | Get all upcoming events (accepts `?limit=6`) |
| `GET` | `/events/:id` | Public | Get single event details |
| `POST` | `/events` | Private | Create a new community event |
| `PUT` | `/events/:id` | Private | Update event details (creator only) |
| `DELETE` | `/events/:id` | Private | Remove an event (creator only) |
| `GET` | `/manage-events` | Private | Get events created by the logged-in user |
| `GET` | `/joined-events` | Private | Get events the logged-in user has joined |
| `POST` | `/events/:id/join` | Private | Join an event as a volunteer |
