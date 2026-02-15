# Architecture: Authentication & Data Storage

## Overview

The Fencing Rules Quiz uses **Neon Auth** (Better Auth) for authentication and the **Neon Data API** (PostgREST) with **Row-Level Security (RLS)** for cloud data storage. There is no backend server — the browser communicates directly with Neon's hosted services.

Authentication is **optional**: anonymous users use localStorage, signed-in users get cloud sync.

## System Architecture

```mermaid
graph TB
    subgraph Browser
        App[Quiz App<br/>Vanilla JS + Vite]
        LS[(localStorage)]
    end

    subgraph Neon Cloud
        Auth[Neon Auth<br/>Better Auth]
        API[Data API<br/>PostgREST]
        DB[(Postgres<br/>+ RLS)]
    end

    subgraph GitHub
        Pages[GitHub Pages<br/>Static Hosting]
    end

    Pages -->|serves| App
    App -->|always| LS
    App -->|sign in/up/out| Auth
    Auth -->|JWT| App
    App -->|CRUD + JWT| API
    API -->|SQL with RLS| DB
```

## Authentication Flow

### Sign In (Email + Password)

```mermaid
sequenceDiagram
    participant U as User
    participant App as Quiz App
    participant Auth as Neon Auth
    participant API as Data API
    participant DB as Postgres

    U->>App: Click "Sign In"
    App->>App: Show auth dialog
    U->>App: Enter email + password
    App->>Auth: POST /api/auth/sign-in/email
    Auth->>Auth: Validate credentials
    Auth-->>App: Session + JWT

    Note over App: Session cookie stored<br/>by Better Auth client

    App->>App: onSessionChange fires
    App->>API: GET /user_progress<br/>Authorization: Bearer JWT
    API->>DB: SELECT * FROM user_progress<br/>WHERE auth.user_id() = user_id
    DB-->>API: Cloud progress (or empty)
    API-->>App: Progress data

    App->>App: Merge localStorage + cloud<br/>(union of answered questions)
    App->>API: POST /user_progress<br/>(upsert merged data)
    API->>DB: INSERT ... ON CONFLICT UPDATE
    App->>App: Update UI with merged progress
```

### Sign In (Google OAuth)

```mermaid
sequenceDiagram
    participant U as User
    participant App as Quiz App
    participant Auth as Neon Auth
    participant Google as Google OAuth

    U->>App: Click "Continue with Google"
    App->>Auth: Redirect to Google OAuth
    Auth->>Google: OAuth authorization request
    Google->>U: Google consent screen
    U->>Google: Approve
    Google->>Auth: Authorization code
    Auth->>Auth: Exchange code for tokens<br/>Create/link user account
    Auth->>App: Redirect back with session
    App->>App: refreshSession() → onSessionChange
    Note over App: Same merge flow as email sign-in
```

### Sign Up

```mermaid
sequenceDiagram
    participant U as User
    participant App as Quiz App
    participant Auth as Neon Auth

    U->>App: Click "Sign Up" tab
    U->>App: Enter name, email, password
    App->>Auth: POST /api/auth/sign-up/email
    Auth->>Auth: Create user account
    Auth-->>App: Session + JWT
    App->>App: Merge local progress → cloud
```

## Data Storage

### Dual-Mode Persistence

```mermaid
flowchart TD
    Save[saveProgress called]
    Save --> Local[Save to localStorage]
    Save --> Check{Signed in?}
    Check -->|No| Done[Done]
    Check -->|Yes| Cloud[Save to Neon Data API]
    Cloud --> RLS[RLS ensures user_id matches JWT]
    RLS --> DB[(Postgres)]
    DB --> Done
```

### Progress Merge on Sign-In

```mermaid
flowchart TD
    SignIn[User signs in] --> Fetch[Fetch cloud progress]
    Fetch --> HasCloud{Cloud data exists?}

    HasCloud -->|No| Upload[Upload localStorage to cloud]
    HasCloud -->|Yes| Merge[Merge: union of local + cloud<br/>answered questions]

    Merge --> LocalNew{Local has questions<br/>cloud doesn't?}
    LocalNew -->|Yes| Upsert[Upsert merged data to cloud]
    LocalNew -->|No| Skip[Skip cloud write]

    Upsert --> UpdateLocal[Update localStorage<br/>with merged data]
    Skip --> UpdateLocal
    Upload --> UpdateLocal
    UpdateLocal --> UI[Update UI]
```

## Data API Security Model

### Row-Level Security (RLS)

```mermaid
flowchart LR
    subgraph Browser
        Req[HTTP Request<br/>+ JWT]
    end

    subgraph Neon Proxy
        Verify[Verify JWT<br/>signature via JWKS]
        Role[Set Postgres role<br/>to 'authenticated']
        Claims[Set auth.user_id<br/>from JWT 'sub' claim]
    end

    subgraph Postgres
        RLS[RLS Policy Check<br/>auth.user_id = user_id]
        Query[Execute Query<br/>filtered to user's rows]
    end

    Req --> Verify --> Role --> Claims --> RLS --> Query
```

### What RLS Enforces

```mermaid
graph LR
    subgraph Allowed
        A1[SELECT own rows]
        A2[INSERT with own user_id]
        A3[UPDATE own rows]
        A4[DELETE own rows]
    end

    subgraph Blocked
        B1[SELECT other users' rows]
        B2[INSERT with forged user_id]
        B3[UPDATE other users' rows]
        B4[Run arbitrary SQL]
        B5[DDL: CREATE/DROP/ALTER]
    end

    style Allowed fill:#d4edda,stroke:#28a745
    style Blocked fill:#f8d7da,stroke:#dc3545
```

## Database Schema

```mermaid
erDiagram
    USER_PROGRESS {
        text user_id PK "DEFAULT auth.user_id()"
        jsonb answered_correctly "DEFAULT '[]'"
        integer questions_per_round "DEFAULT 5"
        integer exam_questions_count "DEFAULT 30"
        timestamptz updated_at "DEFAULT now()"
    }
```

The `user_id` column auto-populates from the JWT on INSERT — the client never sends it. This prevents user_id forgery.

## Anonymous vs. Signed-In Comparison

```mermaid
flowchart TD
    Start[App Loads]
    Start --> LoadLocal[Load progress from localStorage]
    Start --> InitAuth[Initialize auth]
    InitAuth --> HasSession{Existing session?}

    HasSession -->|No| Anonymous[Anonymous Mode<br/>localStorage only]
    HasSession -->|Yes| Merge[Merge & sync with cloud]

    Anonymous --> UseApp[Use quiz normally]
    Merge --> UseApp

    UseApp --> SaveProgress[Save progress]
    SaveProgress --> AlwaysLocal[Always: localStorage]
    SaveProgress --> IfAuth{Signed in?}
    IfAuth -->|Yes| AlsoCloud[Also: Data API]
    IfAuth -->|No| LocalOnly[Local only]
```

| Feature | Anonymous | Signed In |
|---|---|---|
| Quiz functionality | Full | Full |
| Progress storage | localStorage | localStorage + cloud |
| Cross-device sync | No | Yes |
| Data survives clearing browser | No | Yes |
| Requires network | No (after initial load) | For sync only |
