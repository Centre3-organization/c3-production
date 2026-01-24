import { describe, it, expect, vi } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';

// Create a context for testing (no auth required for master data)
function createContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe('MasterData Router', () => {
  describe('getCountries', () => {
    it('should return a list of countries', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const countries = await caller.masterData.getCountries();
      
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThan(0);
      
      // Check structure of first country
      const country = countries[0];
      expect(country).toHaveProperty('id');
      expect(country).toHaveProperty('code');
      expect(country).toHaveProperty('name');
    });

    it('should include Saudi Arabia in the list', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const countries = await caller.masterData.getCountries();
      // Check for SA (ISO 3166-1 alpha-2) or SAU (ISO 3166-1 alpha-3)
      const saudiArabia = countries.find(c => c.code === 'SA' || c.code === 'SAU');
      
      expect(saudiArabia).toBeDefined();
      expect(saudiArabia?.name).toBe('Saudi Arabia');
    });
  });

  describe('getRegions', () => {
    it('should return a list of regions', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const regions = await caller.masterData.getRegions();
      
      expect(Array.isArray(regions)).toBe(true);
      expect(regions.length).toBeGreaterThan(0);
      
      // Check structure
      const region = regions[0];
      expect(region).toHaveProperty('id');
      expect(region).toHaveProperty('code');
      expect(region).toHaveProperty('name');
    });

    it('should include Middle East region', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const regions = await caller.masterData.getRegions();
      const middleEast = regions.find(r => r.code === 'ME');
      
      expect(middleEast).toBeDefined();
      expect(middleEast?.name).toBe('Middle East');
    });
  });

  describe('getCities', () => {
    it('should return all cities when no filter provided', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const cities = await caller.masterData.getCities();
      
      expect(Array.isArray(cities)).toBe(true);
      expect(cities.length).toBeGreaterThan(0);
    });

    it('should filter cities by countryId', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      
      // First get Saudi Arabia's ID
      const countries = await caller.masterData.getCountries();
      const saudiArabia = countries.find(c => c.code === 'SA');
      
      if (saudiArabia) {
        const cities = await caller.masterData.getCities({ countryId: saudiArabia.id });
        
        expect(Array.isArray(cities)).toBe(true);
        // All returned cities should belong to Saudi Arabia
        cities.forEach(city => {
          expect(city.countryId).toBe(saudiArabia.id);
        });
      }
    });

    it('should include Riyadh in Saudi Arabia cities', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      
      const countries = await caller.masterData.getCountries();
      const saudiArabia = countries.find(c => c.code === 'SA');
      
      if (saudiArabia) {
        const cities = await caller.masterData.getCities({ countryId: saudiArabia.id });
        const riyadh = cities.find(c => c.name === 'Riyadh');
        
        expect(riyadh).toBeDefined();
      }
    });
  });

  describe('getSiteTypes', () => {
    it('should return a list of site types', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const siteTypes = await caller.masterData.getSiteTypes();
      
      expect(Array.isArray(siteTypes)).toBe(true);
      expect(siteTypes.length).toBeGreaterThan(0);
      
      // Check structure
      const siteType = siteTypes[0];
      expect(siteType).toHaveProperty('id');
      expect(siteType).toHaveProperty('code');
      expect(siteType).toHaveProperty('name');
    });

    it('should include Data Center type', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const siteTypes = await caller.masterData.getSiteTypes();
      const dataCenter = siteTypes.find(t => t.code === 'DC');
      
      expect(dataCenter).toBeDefined();
      expect(dataCenter?.name).toBe('Data Center');
    });
  });

  describe('getZoneTypes', () => {
    it('should return a list of zone types', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const zoneTypes = await caller.masterData.getZoneTypes();
      
      expect(Array.isArray(zoneTypes)).toBe(true);
      expect(zoneTypes.length).toBeGreaterThan(0);
      
      // Check structure
      const zoneType = zoneTypes[0];
      expect(zoneType).toHaveProperty('id');
      expect(zoneType).toHaveProperty('code');
      expect(zoneType).toHaveProperty('name');
    });

    it('should include Server Room type', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const zoneTypes = await caller.masterData.getZoneTypes();
      const serverRoom = zoneTypes.find(t => t.code === 'SERVER');
      
      expect(serverRoom).toBeDefined();
      expect(serverRoom?.name).toBe('Server Room');
    });
  });

  describe('getAreaTypes', () => {
    it('should return a list of area types', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const areaTypes = await caller.masterData.getAreaTypes();
      
      expect(Array.isArray(areaTypes)).toBe(true);
      expect(areaTypes.length).toBeGreaterThan(0);
      
      // Check structure
      const areaType = areaTypes[0];
      expect(areaType).toHaveProperty('id');
      expect(areaType).toHaveProperty('code');
      expect(areaType).toHaveProperty('name');
    });

    it('should include Rack Row type', async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);
      const areaTypes = await caller.masterData.getAreaTypes();
      const rackRow = areaTypes.find(t => t.code === 'RACK_ROW');
      
      expect(rackRow).toBeDefined();
      expect(rackRow?.name).toBe('Rack Row');
    });
  });
});
