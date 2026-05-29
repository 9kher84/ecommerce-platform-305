# OFFICIAL OWNER DIRECTIVE — MOBILE APP

**Status**: ACTIVE & BINDING
**Date**: 2025-12-16

## 1. Status Declaration

The Mobile Application is officially classified as:

- ✅ **Security Architecture Proof-of-Concept (POC)**
- ❌ **NOT a Product**
- ❌ **NOT Customer-Facing**
- ❌ **NO Store Release authorized**

## 2. Immediate Mandatory Fixes

### A. SSL Pinning

- **Requirement**: Remove placeholder pins (`AAAA`/`BBBB`).
- **Implementation**: Use Build-time injection (`react-native-config`) or Secure Remote Config.

### B. Remote Config

- **Requirement**: App must fetch status on launch.
- **Keys**:
  - `MOBILE_APP_ENABLED` (bool)
  - `API_BASE_URL` (string)
  - `FORCE_UPDATE_REQUIRED` (bool)
- **Behavior**: If disabled -> Show Maintenance Block immediately.

## 3. Forbidden Forever (Explicit Ban)

The Mobile App must **NEVER**:

1.  Call `/api/owner/*`
2.  Contain Trace logic
3.  Show policy reasons/traces
4.  Perform Overrides
5.  Simulate Actor vs Owner
6.  Store audit data

## 4. Architecture Alignment (Next Phase)

Feature development is **FROZEN** until:

1.  Web platform is live.
2.  Backend APIs are stabilized.
3.  Owner Panel is sealed in production.

## 5. Required Deliverables (Pre-Release)

1.  Mobile Threat Model.
2.  Backend Rate Limits confirmation.
3.  Kill Switch verification.
4.  App Store Compliance Review.
