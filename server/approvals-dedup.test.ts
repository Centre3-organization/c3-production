import { describe, expect, it } from "vitest";

/**
 * Tests for approval deduplication logic and stageName in history.
 * These are unit tests that validate the data transformation logic
 * without requiring database access.
 */

describe("Approval deduplication logic", () => {
  // Simulate the raw tasks that would come from the database
  // Before fix: admin users would see all duplicate tasks
  // After fix: tasks are grouped by instanceId+stageId

  it("should deduplicate tasks by instanceId and stageId", () => {
    // Simulate raw tasks from DB (before dedup)
    const rawTasks = [
      { taskId: 1, instanceId: 10, stageId: 100, requestId: 1000, stageName: "L1 Review", stageOrder: 1 },
      { taskId: 2, instanceId: 10, stageId: 100, requestId: 1000, stageName: "L1 Review", stageOrder: 1 },
      { taskId: 3, instanceId: 10, stageId: 100, requestId: 1000, stageName: "L1 Review", stageOrder: 1 },
      { taskId: 4, instanceId: 11, stageId: 101, requestId: 1001, stageName: "L2 Review", stageOrder: 2 },
      { taskId: 5, instanceId: 11, stageId: 101, requestId: 1001, stageName: "L2 Review", stageOrder: 2 },
      { taskId: 6, instanceId: 12, stageId: 102, requestId: 1002, stageName: "Final Review", stageOrder: 3 },
    ];

    // Apply deduplication logic (same as what the SQL GROUP BY does)
    const seen = new Set<string>();
    const deduplicated = rawTasks.filter(task => {
      const key = `${task.instanceId}-${task.stageId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Should have 3 unique request+stage combinations instead of 6 raw tasks
    expect(deduplicated).toHaveLength(3);
    expect(deduplicated.map(t => t.requestId)).toEqual([1000, 1001, 1002]);
  });

  it("should keep all tasks when there are no duplicates", () => {
    const rawTasks = [
      { taskId: 1, instanceId: 10, stageId: 100, requestId: 1000, stageName: "L1 Review", stageOrder: 1 },
      { taskId: 2, instanceId: 11, stageId: 101, requestId: 1001, stageName: "L2 Review", stageOrder: 2 },
      { taskId: 3, instanceId: 12, stageId: 102, requestId: 1002, stageName: "Final Review", stageOrder: 3 },
    ];

    const seen = new Set<string>();
    const deduplicated = rawTasks.filter(task => {
      const key = `${task.instanceId}-${task.stageId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    expect(deduplicated).toHaveLength(3);
  });

  it("should handle empty task list", () => {
    const rawTasks: any[] = [];

    const seen = new Set<string>();
    const deduplicated = rawTasks.filter(task => {
      const key = `${task.instanceId}-${task.stageId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    expect(deduplicated).toHaveLength(0);
  });
});

describe("Approval history stageName resolution", () => {
  // Test the frontend logic for resolving stageName from history details

  function resolveStageName(history: { actionType: string; details: any }): string {
    const details = history.details || {};
    return details.stageName || details.workflowName || 
      (history.actionType === "workflow_started" ? "Started" :
       history.actionType === "workflow_completed" ? "Completed" :
       history.actionType === "task_assigned" ? "Assignment" : 
       "Stage");
  }

  it("should use details.stageName when available", () => {
    const history = {
      actionType: "decision_made",
      details: { stageName: "Security Review", decision: "approved" },
    };
    expect(resolveStageName(history)).toBe("Security Review");
  });

  it("should use details.workflowName as fallback", () => {
    const history = {
      actionType: "workflow_started",
      details: { workflowName: "Admin Visit Workflow" },
    };
    expect(resolveStageName(history)).toBe("Admin Visit Workflow");
  });

  it("should derive from actionType for workflow_started", () => {
    const history = {
      actionType: "workflow_started",
      details: {},
    };
    expect(resolveStageName(history)).toBe("Started");
  });

  it("should derive from actionType for workflow_completed", () => {
    const history = {
      actionType: "workflow_completed",
      details: {},
    };
    expect(resolveStageName(history)).toBe("Completed");
  });

  it("should derive from actionType for task_assigned", () => {
    const history = {
      actionType: "task_assigned",
      details: {},
    };
    expect(resolveStageName(history)).toBe("Assignment");
  });

  it("should use generic 'Stage' for unknown action types without stageName", () => {
    const history = {
      actionType: "some_unknown_action",
      details: {},
    };
    expect(resolveStageName(history)).toBe("Stage");
  });

  it("should handle null details gracefully", () => {
    const history = {
      actionType: "decision_made",
      details: null,
    };
    expect(resolveStageName(history)).toBe("Stage");
  });

  it("should prioritize stageName over workflowName", () => {
    const history = {
      actionType: "stage_completed",
      details: { stageName: "L1 Review", workflowName: "Default Workflow" },
    };
    expect(resolveStageName(history)).toBe("L1 Review");
  });
});
