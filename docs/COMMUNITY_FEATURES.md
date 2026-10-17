# RIDEX Community, Squadrons & Rider Gamification

## 1. Overview
The Community module (`/community`, `/profile`, `/history`, `/notifications`) brings motorcycle clubs, regional touring chapters, squad rosters, verified riding milestones, and social feed interaction to the RIDEX web platform.

## 2. Key Modules & Implementations

### A. Rider Cockpit Profiles (`/profile` & `/profile/:id`)
- **Authoritative Identity**: Reuses the authenticated Supabase `public.profiles` record without duplicate identities.
- **Rider Telemetry**:
  - Full Name & Rider Handle / Callsign (`@handle`).
  - Rider Bio & Touring Ethos.
  - Home base location (City / State) — sharing is optional and respects rider privacy.
  - Enlistment date.
- **Garage Integration**: Displays the rider's primary registered motorcycle from `public.motorcycles` (Year, Make, Model, CC displacement, Fuel Tank capacity, and efficiency km/l).
- **Profile Editing**: Authenticated in-place profile updates (`authService.updateProfile`) with validation and instant feedback.

### B. Squadrons & Riding Clubs (`/community` -> Squads Tab)
- **Database Tables**: Backed by `public.groups` and `public.group_members`.
- **Squad Discovery**: Lists regional riding chapters with banner imagery, member count, territory badge, and mission philosophy.
- **Enlist / Leave**: Real-time membership toggle (`communityService.toggleJoinGroup`) updating `group_members` with roles (`owner` vs `member`).
- **Squad Formation**: Modal dialog allowing verified riders to register new touring chapters with name, operational territory, and riding philosophy.

### C. Community Expedition Feed (`/community` -> Feed Tab)
- **Database Tables**: Backed by `public.posts`, `public.post_likes`, and `public.comments`.
- **Feed Features**:
  - Rider post creation with text caption, optional route location, and tour reference.
  - Interactive Like / Unlike toggle with optimistic counter updates.
  - Inline expandable comment stream with instant comment submission.
  - Clean timestamp formatting and rider callsign display.

### D. Verified Milestones & Achievements (`/community` -> Milestones Tab)
- **Anti-Fabrication Principle**: Zero mock achievements or fabricated stats. All badges are calculated strictly from authentic database records:
  - `FIRST_EXPEDITION`: Completed or hosted >= 1 squad tour.
  - `ROAD_CAPTAIN`: Organized and led >= 1 squad expedition as host.
  - `CENTURY_RIDER`: Accumulated >= 100 km of verified touring distance.
  - `FLEET_COMMANDER`: Configured >= 1 motorcycle in the digital garage.
  - `IRON_EXPLORER`: Logged >= 300 km across squad expeditions.

### E. Touring History & Logbook (`/history`)
- **Complete Expedition Log**: Shows all rides where the rider was the organizer or an approved participant.
- **Filterable**: All Tours, Completed Tours, Active / Scheduled, and Hosted as Road Captain.
- **Distance Integrity**: Clearly distinguishes planned route distance from recorded telemetry.
- **Aggregate Metrics**: Total Distance (KM), Total Tours, Completed Tours, and Captain Expeditions.

### F. Real-time Notification Center (`/notifications`)
- **Database Contract**: Backed by `public.notifications` with real-time Supabase subscription (`postgres_changes`).
- **Event Types**:
  - `SOS_ALERT`: Emergency assistance broadcasts.
  - `SEPARATION_WARNING`: Squad proximity alerts.
  - `JOIN_REQUEST` & `APPROVAL`: Tour participant management.
- **Actions**: Mark individual notification as read, mark all read, and click-through navigation to relevant routes.
- **Browser Push Note**: Honest in-app delivery notice clarifying mobile browser background execution limits.
