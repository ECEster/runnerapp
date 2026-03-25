# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RunningNL is a bilingual (Dutch/English) running events platform for the Netherlands. It is built as a **low-code stack** — there is no traditional backend or frontend framework. All logic lives across connected SaaS tools.

## Tech Stack

| Tool | Role |
|---|---|
| **Webflow** | Website design, frontend, CMS (renders event pages) |
| **Airtable** | Primary events database |
| **Memberstack** | User accounts, personal dashboards, access control |
| **Make (Integromat)** | Automation workflows (e.g. Airtable → Webflow sync) |
| **Cloudinary** | User photo uploads and storage |

## Site Structure

```
/                    ← Homepage + featured upcoming events
/agenda              ← Full event list with filters (date, distance, location, type)
/evenement/[slug]    ← Individual event detail page
/inloggen            ← Login / register (Memberstack)
/mijn-account        ← Personal dashboard (favorites, results, photos)
/evenement-aanmelden ← Event submission form (organizers + users)
```

## Event Data Model

Fields per event: Name, Date, Location, Distance(s), Type (Race/Recreational/Trail), Registration link, Organizer, Photos, Status (Draft/Published), Source (Manual/Organizer/Import/User suggestion).

## Data Flow

Events enter the system via three paths:
1. **Import** — scheduled/manual sync from external Dutch running calendars (hardloopkalender.nl, atletiek.nl)
2. **Organizer submissions** — form → moderation queue → admin approval → publish
3. **User suggestions** — logged-in users flag missing events for admin review

Make automations connect these: a new approved row in Airtable triggers publishing to Webflow CMS.

## User Roles

- **Public** — browse/filter events, view event pages, submit event suggestions
- **Registered users** — save favorites, log results (time/distance/notes), upload photos
- **Event organizers** — submit and manage their own events (post-approval)
- **Admin (Ester)** — approve/reject events, manage all content via Airtable + Webflow

## Languages

Dutch is the primary language; English is secondary. All user-facing copy and CMS fields should support both.

## Any code in this repo

Scripts or code files here are likely utilities for: importing event data, Make webhook handlers, Airtable scripting, or Cloudinary integration helpers — not a full application.
