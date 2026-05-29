import React from "react";
import { Outlet } from "react-router-dom";

// 👑 Sovereign Isolation Phase 3.3
// The Frontend does NOT check roles. It blindly trusts the "Owner Channel".
// If the channel is closed (401), the Data Layer (ownerService) handles the rejection.
// We avoid "AuthContext" entirely to prevent role pollution.

const OwnerRoute = () => {
  return <Outlet />;
};

export default OwnerRoute;
