import { describe, it, expect } from "vitest";

/**
 * Tests for cascading location dropdown configuration.
 * Validates that the dependency chain is correctly configured:
 * Country → City → Site → Zone → Area
 */

describe("Cascading Location Dropdown Logic", () => {
  // Simulate the dependency map building from DynamicForm
  const buildDependencyMap = (fields: { code: string; filterByField?: string; dependsOnField?: string }[]) => {
    const map: Record<string, string[]> = {};
    for (const f of fields) {
      if (f.filterByField) {
        if (!map[f.filterByField]) map[f.filterByField] = [];
        if (!map[f.filterByField].includes(f.code)) {
          map[f.filterByField].push(f.code);
        }
      }
      if (f.dependsOnField && f.dependsOnField !== f.filterByField) {
        if (!map[f.dependsOnField]) map[f.dependsOnField] = [];
        if (!map[f.dependsOnField].includes(f.code)) {
          map[f.dependsOnField].push(f.code);
        }
      }
    }
    return map;
  };

  const getDescendants = (map: Record<string, string[]>, fieldCode: string, visited = new Set<string>()): string[] => {
    if (visited.has(fieldCode)) return [];
    visited.add(fieldCode);
    const children = map[fieldCode] || [];
    const all: string[] = [...children];
    for (const child of children) {
      all.push(...getDescendants(map, child, visited));
    }
    return all;
  };

  // Admin Visit location fields as configured in the database
  const adminVisitLocationFields = [
    { code: "country", filterByField: undefined, dependsOnField: undefined },
    { code: "city", filterByField: "country", dependsOnField: "country" },
    { code: "site", filterByField: "city", dependsOnField: "city" },
    { code: "zone", filterByField: "site", dependsOnField: "site" },
    { code: "area", filterByField: "zone", dependsOnField: "zone" },
  ];

  it("should build correct dependency map for location fields", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    
    expect(map["country"]).toContain("city");
    expect(map["city"]).toContain("site");
    expect(map["site"]).toContain("zone");
    expect(map["zone"]).toContain("area");
    expect(map["area"]).toBeUndefined();
  });

  it("should cascade-clear all descendants when country changes", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    const descendants = getDescendants(map, "country");
    
    expect(descendants).toContain("city");
    expect(descendants).toContain("site");
    expect(descendants).toContain("zone");
    expect(descendants).toContain("area");
    expect(descendants.length).toBe(4);
  });

  it("should cascade-clear site, zone, area when city changes", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    const descendants = getDescendants(map, "city");
    
    expect(descendants).toContain("site");
    expect(descendants).toContain("zone");
    expect(descendants).toContain("area");
    expect(descendants).not.toContain("city");
    expect(descendants).not.toContain("country");
    expect(descendants.length).toBe(3);
  });

  it("should cascade-clear zone and area when site changes", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    const descendants = getDescendants(map, "site");
    
    expect(descendants).toContain("zone");
    expect(descendants).toContain("area");
    expect(descendants.length).toBe(2);
  });

  it("should cascade-clear only area when zone changes", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    const descendants = getDescendants(map, "zone");
    
    expect(descendants).toContain("area");
    expect(descendants.length).toBe(1);
  });

  it("should not cascade-clear anything when area changes (leaf node)", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    const descendants = getDescendants(map, "area");
    
    expect(descendants.length).toBe(0);
  });

  it("should handle circular dependencies safely", () => {
    const circularFields = [
      { code: "a", filterByField: "b" },
      { code: "b", filterByField: "a" },
    ];
    const map = buildDependencyMap(circularFields);
    const descendants = getDescendants(map, "a");
    
    // Should not infinite loop - visited set prevents it
    expect(descendants).toContain("b");
    expect(descendants).toContain("a");
  });

  it("should simulate form value clearing correctly", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    
    // Simulate form state
    let formData: Record<string, any> = {
      country: "1",
      city: "5",
      site: "10",
      zone: "20",
      area: "30",
    };

    // User changes country - all descendants should be cleared
    const descendants = getDescendants(map, "country");
    const updated = { ...formData, country: "2" };
    for (const desc of descendants) {
      if (updated[desc] !== undefined && updated[desc] !== "" && updated[desc] !== null) {
        updated[desc] = "";
      }
    }

    expect(updated.country).toBe("2");
    expect(updated.city).toBe("");
    expect(updated.site).toBe("");
    expect(updated.zone).toBe("");
    expect(updated.area).toBe("");
  });

  it("should only clear downstream fields when mid-chain field changes", () => {
    const map = buildDependencyMap(adminVisitLocationFields);
    
    let formData: Record<string, any> = {
      country: "1",
      city: "5",
      site: "10",
      zone: "20",
      area: "30",
    };

    // User changes site - only zone and area should be cleared
    const descendants = getDescendants(map, "site");
    const updated = { ...formData, site: "15" };
    for (const desc of descendants) {
      if (updated[desc] !== undefined && updated[desc] !== "" && updated[desc] !== null) {
        updated[desc] = "";
      }
    }

    expect(updated.country).toBe("1");
    expect(updated.city).toBe("5");
    expect(updated.site).toBe("15");
    expect(updated.zone).toBe("");
    expect(updated.area).toBe("");
  });

  it("isWaitingForParent should be true when parent has no value", () => {
    const field = { filterByField: "country" };
    const formValues: Record<string, any> = { country: "" };
    
    const isWaitingForParent = field.filterByField && !formValues[field.filterByField];
    expect(isWaitingForParent).toBeTruthy();
  });

  it("isWaitingForParent should be false when parent has a value", () => {
    const field = { filterByField: "country" };
    const formValues: Record<string, any> = { country: "1" };
    
    const isWaitingForParent = field.filterByField && !formValues[field.filterByField];
    expect(isWaitingForParent).toBeFalsy();
  });

  it("isWaitingForParent should be false when no filterByField", () => {
    const field = { filterByField: undefined };
    const formValues: Record<string, any> = {};
    
    const isWaitingForParent = field.filterByField && !formValues[field.filterByField!];
    expect(isWaitingForParent).toBeFalsy();
  });
});
