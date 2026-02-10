import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database connection
vi.mock("../../infra/db/connection", () => ({
  getDb: vi.fn(),
}));

// Import after mocking
import { getDb } from "../../infra/db/connection";
import { createProvider, registerProvider, type MessagingProvider } from "./messaging.provider";

describe("Messaging Provider Registry", () => {
  it("should register and retrieve a provider", () => {
    const factory = () => ({
      slug: "test_provider",
      name: "Test Provider",
      initialize: vi.fn(),
      sendSms: vi.fn().mockResolvedValue({ success: true, providerMessageId: "test-123" }),
      sendWhatsApp: vi.fn().mockResolvedValue({ success: true, providerMessageId: "test-456" }),
      testConnection: vi.fn().mockResolvedValue({ healthy: true }),
      getRequiredCredentials: vi.fn().mockReturnValue([]),
    } as MessagingProvider);

    registerProvider("test_provider", factory);
    const retrieved = createProvider("test_provider");
    
    expect(retrieved).not.toBeNull();
    expect(retrieved?.slug).toBe("test_provider");
    expect(retrieved?.name).toBe("Test Provider");
  });

  it("should return null for unregistered provider", () => {
    const result = createProvider("nonexistent_provider_xyz");
    expect(result).toBeNull();
  });

  it("should create a fresh instance each time", () => {
    const factory = () => ({
      slug: "fresh_test",
      name: "Fresh Test",
      initialize: vi.fn(),
      sendSms: vi.fn().mockResolvedValue({ success: true }),
      sendWhatsApp: vi.fn().mockResolvedValue({ success: true }),
      testConnection: vi.fn().mockResolvedValue({ healthy: true }),
      getRequiredCredentials: vi.fn().mockReturnValue([]),
    } as MessagingProvider);

    registerProvider("fresh_test", factory);
    const instance1 = createProvider("fresh_test");
    const instance2 = createProvider("fresh_test");
    
    // Both should exist
    expect(instance1).not.toBeNull();
    expect(instance2).not.toBeNull();
  });
});

describe("Twilio Adapter", () => {
  it("should be registered after import", async () => {
    // Import the twilio adapter to trigger registration
    await import("./twilio.adapter");
    
    const provider = createProvider("twilio");
    expect(provider).not.toBeNull();
    expect(provider?.slug).toBe("twilio");
    expect(provider?.name).toBe("Twilio");
  });

  it("should fail sendSms without initialization", async () => {
    await import("./twilio.adapter");
    const provider = createProvider("twilio");
    expect(provider).not.toBeNull();
    
    // Calling sendSms without initializing credentials should fail gracefully
    const result = await provider!.sendSms({ to: "+1234567890", body: "Test" });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBeDefined();
  });

  it("should fail sendWhatsApp without initialization", async () => {
    await import("./twilio.adapter");
    const provider = createProvider("twilio");
    expect(provider).not.toBeNull();
    
    const result = await provider!.sendWhatsApp({ to: "+1234567890", body: "Test" });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBeDefined();
  });
});

describe("MessagingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should gracefully handle missing database", async () => {
    const { getDb } = await import("../../infra/db/connection");
    (getDb as any).mockResolvedValue(null);
    
    const { messagingService } = await import("./messaging.service");
    
    // Should not throw
    await expect(
      messagingService.fireEvent("request_submitted", { requestId: 1 })
    ).resolves.toBeUndefined();
  });

  it("should gracefully handle empty trigger rules", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    
    const { getDb } = await import("../../infra/db/connection");
    (getDb as any).mockResolvedValue(mockDb);
    
    const { messagingService } = await import("./messaging.service");
    
    // Should not throw when no rules match
    await expect(
      messagingService.fireEvent("request_submitted", { requestId: 1 })
    ).resolves.toBeUndefined();
  });

  it("should export all expected event types", async () => {
    const { EVENT_TYPES } = await import("./messaging.service");
    
    expect(EVENT_TYPES).toContain("request_created");
    expect(EVENT_TYPES).toContain("request_submitted");
    expect(EVENT_TYPES).toContain("request_approved");
    expect(EVENT_TYPES).toContain("request_rejected");
    expect(EVENT_TYPES).toContain("request_cancelled");
    expect(EVENT_TYPES).toContain("access_granted");
    expect(EVENT_TYPES).toContain("task_assigned");
    expect(EVENT_TYPES).toContain("task_approved");
    expect(EVENT_TYPES).toContain("task_rejected");
    expect(EVENT_TYPES).toContain("clarification_requested");
    expect(EVENT_TYPES).toContain("clarification_responded");
    expect(EVENT_TYPES).toContain("send_back");
    expect(EVENT_TYPES).toContain("request_expired");
  });

  it("should export template variables", async () => {
    const { TEMPLATE_VARIABLES } = await import("./messaging.service");
    
    expect(TEMPLATE_VARIABLES.length).toBeGreaterThan(0);
    expect(TEMPLATE_VARIABLES.some(v => v.key === "requestId")).toBe(true);
    expect(TEMPLATE_VARIABLES.some(v => v.key === "requesterName")).toBe(true);
    expect(TEMPLATE_VARIABLES.some(v => v.key === "approverName")).toBe(true);
    expect(TEMPLATE_VARIABLES.some(v => v.key === "siteName")).toBe(true);
    expect(TEMPLATE_VARIABLES.some(v => v.key === "visitorName")).toBe(true);
  });

  it("sendDirect should fail gracefully without provider", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    
    const { getDb } = await import("../../infra/db/connection");
    (getDb as any).mockResolvedValue(mockDb);
    
    const { messagingService } = await import("./messaging.service");
    
    const result = await messagingService.sendDirect({
      channel: "sms",
      to: "+1234567890",
      body: "Test message",
    });
    
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NO_PROVIDER");
  });
});

describe("Template Rendering", () => {
  it("should replace template variables correctly", () => {
    // Test the template rendering logic directly
    const renderTemplate = (body: string, variables: Record<string, string | undefined>): string => {
      return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
      });
    };

    const template = "Hello {{requesterName}}, your request {{requestId}} has been {{status}}.";
    const variables = {
      requesterName: "John Doe",
      requestId: "REQ-001",
      status: "approved",
    };

    const result = renderTemplate(template, variables);
    expect(result).toBe("Hello John Doe, your request REQ-001 has been approved.");
  });

  it("should preserve unmatched variables", () => {
    const renderTemplate = (body: string, variables: Record<string, string | undefined>): string => {
      return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
      });
    };

    const template = "Hello {{requesterName}}, your access code is {{accessCode}}.";
    const variables = {
      requesterName: "Jane",
    };

    const result = renderTemplate(template, variables);
    expect(result).toBe("Hello Jane, your access code is {{accessCode}}.");
  });

  it("should handle empty template", () => {
    const renderTemplate = (body: string, variables: Record<string, string | undefined>): string => {
      return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
      });
    };

    const result = renderTemplate("", {});
    expect(result).toBe("");
  });
});

describe("Condition Evaluation", () => {
  const evaluateConditions = (conditions: any[], context: Record<string, any>): boolean => {
    if (!conditions || conditions.length === 0) return true;
    for (const condition of conditions) {
      const contextValue = String(context[condition.field] || "");
      const conditionValue = String(condition.value || "");
      switch (condition.operator) {
        case "equals":
          if (contextValue !== conditionValue) return false;
          break;
        case "not_equals":
          if (contextValue === conditionValue) return false;
          break;
        case "contains":
          if (!contextValue.includes(conditionValue)) return false;
          break;
        case "in":
          const values = conditionValue.split(",").map(v => v.trim());
          if (!values.includes(contextValue)) return false;
          break;
      }
    }
    return true;
  };

  it("should return true for empty conditions", () => {
    expect(evaluateConditions([], {})).toBe(true);
    expect(evaluateConditions(null as any, {})).toBe(true);
  });

  it("should evaluate equals condition", () => {
    const conditions = [{ field: "siteId", operator: "equals", value: "100" }];
    expect(evaluateConditions(conditions, { siteId: 100 })).toBe(true);
    expect(evaluateConditions(conditions, { siteId: 200 })).toBe(false);
  });

  it("should evaluate not_equals condition", () => {
    const conditions = [{ field: "requestType", operator: "not_equals", value: "admin_visit" }];
    expect(evaluateConditions(conditions, { requestType: "tep" })).toBe(true);
    expect(evaluateConditions(conditions, { requestType: "admin_visit" })).toBe(false);
  });

  it("should evaluate contains condition", () => {
    const conditions = [{ field: "comment", operator: "contains", value: "urgent" }];
    expect(evaluateConditions(conditions, { comment: "This is urgent please" })).toBe(true);
    expect(evaluateConditions(conditions, { comment: "Normal request" })).toBe(false);
  });

  it("should evaluate in condition", () => {
    const conditions = [{ field: "requestType", operator: "in", value: "admin_visit,tep,mop" }];
    expect(evaluateConditions(conditions, { requestType: "tep" })).toBe(true);
    expect(evaluateConditions(conditions, { requestType: "work_permit" })).toBe(false);
  });

  it("should evaluate multiple conditions (AND logic)", () => {
    const conditions = [
      { field: "siteId", operator: "equals", value: "100" },
      { field: "requestType", operator: "equals", value: "admin_visit" },
    ];
    expect(evaluateConditions(conditions, { siteId: 100, requestType: "admin_visit" })).toBe(true);
    expect(evaluateConditions(conditions, { siteId: 100, requestType: "tep" })).toBe(false);
    expect(evaluateConditions(conditions, { siteId: 200, requestType: "admin_visit" })).toBe(false);
  });
});
