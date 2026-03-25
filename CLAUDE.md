# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RunningNL is a bilingual (Dutch/English) running events platform for the Netherlands. The goal is to start simple: a website with a table showing upcoming running events.

## Tech Stack

| Tool | Role |
|---|---|
| **Webflow** | Website design, frontend, CMS (renders event pages) |
| **Memberstack** | User accounts, personal dashboards, access control |
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

Fields per event: Name, Date, Location, Distance(s), Type (Race/Recreational/Trail), Registration link, Organizer, Photos, Status (Draft/Published).

## Current Phase

**Phase 1 — Simple event table**
- Webflow CMS collection for events (matching the data model above)
- `/agenda` page with a basic table/list of upcoming runs
- Manual data entry to start; no imports or automations yet

## User Roles

- **Public** — browse/filter events, view event pages
- **Registered users** — save favorites, log results (time/distance/notes), upload photos
- **Event organizers** — submit and manage their own events
- **Admin (Ester)** — manage all content via Webflow CMS

## Languages

Dutch is the primary language; English is secondary. All user-facing copy and CMS fields should support both.
