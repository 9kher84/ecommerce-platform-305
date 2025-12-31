# 2. Sovereign Architecture

## The "God Mode" Problem
Traditional admin panels often bypass logic, creating "Ghost Data" (valid in DB, invalid in logic).
Our Architecture solves this by **Forcing Logic, Not State**.

## Core Components

### 1. Policy Engine
*   **Location**: `backend/utils/PolicyEngine.js`
*   **Function**: Pure, deterministic function `trace(actor, resource, action)`.
*   **Role**: The "Legislative" branch. Defines what *should* happen.

### 2. Owner Controller
*   **Location**: `backend/controllers/ownerController.js`
*   **Function**: The "Executive" branch. Can execute `override*` methods.
*   **Constraint**: MUST generate a `TraceSnapshot` of the *policy violation* before executing the *state mutation*.

### 3. Trace Viewer
*   **Location**: `frontend/components/owner/TraceViewer.jsx`
*   **Function**: The "Judicial" view. Visualizes the disparity between Policy and Action.

## Data Flow
`User Action` -> `Policy Check (Deny)` -> `Owner Review (Trace)` -> `Owner Override (Force)` -> `Audit Log (Sealed)`
