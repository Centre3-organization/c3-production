import React from "react";
import { Route } from "wouter";
import { CheckpointHome } from "./CheckpointHome";
import { CheckpointSearch } from "./CheckpointSearch";
import { CheckpointLogin } from "./CheckpointLogin";

/**
 * Checkpoint App Router
 * Separate routing for the security checkpoint interface
 */
export function CheckpointApp() {
  return (
    <>
      <Route path="/checkpoint/login" component={CheckpointLogin} />
      <Route path="/checkpoint/search" component={CheckpointSearch} />
      <Route path="/checkpoint" component={CheckpointHome} />
      <Route path="/checkpoint/*" component={CheckpointHome} />
    </>
  );
}
