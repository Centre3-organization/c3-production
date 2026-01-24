import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../../../routers';
import { getDb } from '../../../infra/db/connection';

describe('requests router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  
  beforeAll(() => {
    caller = appRouter.createCaller({
      user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'admin' }
    } as any);
  });

  describe('getAll', () => {
    it('should return a list of requests', async () => {
      const result = await caller.requests.getAll({});
      
      expect(result).toBeDefined();
      expect(result.requests).toBeDefined();
      expect(Array.isArray(result.requests)).toBe(true);
      expect(result.total).toBeDefined();
      expect(typeof result.total).toBe('number');
    });

    it('should filter by status', async () => {
      const result = await caller.requests.getAll({ status: 'pending_l1' });
      
      expect(result).toBeDefined();
      expect(result.requests).toBeDefined();
      // All returned requests should have pending_l1 status
      result.requests.forEach(req => {
        expect(req.status).toBe('pending_l1');
      });
    });

    it('should filter by type', async () => {
      const result = await caller.requests.getAll({ type: 'admin_visit' });
      
      expect(result).toBeDefined();
      expect(result.requests).toBeDefined();
      // All returned requests should have admin_visit type
      result.requests.forEach(req => {
        expect(req.type).toBe('admin_visit');
      });
    });
  });

  describe('getPendingL1', () => {
    it('should return requests pending L1 approval', async () => {
      const result = await caller.requests.getPendingL1();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // All returned requests should have pending_l1 status
      result.forEach(req => {
        expect(req.status).toBe('pending_l1');
      });
    });
  });

  describe('getPendingManual', () => {
    it('should return requests pending manual approval', async () => {
      const result = await caller.requests.getPendingManual();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // All returned requests should have pending_manual status
      result.forEach(req => {
        expect(req.status).toBe('pending_manual');
      });
    });
  });

  describe('getStats', () => {
    it('should return request statistics', async () => {
      const result = await caller.requests.getStats();
      
      expect(result).toBeDefined();
      expect(typeof result.totalRequests).toBe('number');
      expect(typeof result.pendingL1).toBe('number');
      expect(typeof result.pendingManual).toBe('number');
      expect(typeof result.approved).toBe('number');
      expect(typeof result.rejected).toBe('number');
    });
  });

  describe('getById', () => {
    it('should return a request by ID', async () => {
      // First get all requests to find a valid ID
      const allRequests = await caller.requests.getAll({ limit: 1 });
      
      if (allRequests.requests.length > 0) {
        const requestId = allRequests.requests[0].id;
        const result = await caller.requests.getById({ id: requestId });
        
        expect(result).toBeDefined();
        expect(result.id).toBe(requestId);
        expect(result.requestNumber).toBeDefined();
        expect(result.visitorName).toBeDefined();
      }
    });

    it('should return null for non-existent request', async () => {
      const result = await caller.requests.getById({ id: 999999 });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new request as draft by default', async () => {
      const timestamp = Date.now();
      const newRequest = {
        type: 'admin_visit' as const,
        visitorName: `Test Visitor ${timestamp}`,
        visitorIdType: 'national_id' as const,
        visitorIdNumber: `ID${timestamp}`,
        visitorCompany: 'Test Company',
        visitorPhone: '+966501234567',
        visitorEmail: 'test@example.com',
        siteId: 1,
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        startTime: '09:00',
        endTime: '17:00',
        purpose: 'Test visit for vitest',
        zoneIds: [2],
      };
      
      const result = await caller.requests.create(newRequest);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.requestNumber).toBeDefined();
      expect(result.visitorName).toBe(newRequest.visitorName);
      expect(result.status).toBe('draft');
    });

    it('should create and submit a request immediately', async () => {
      const timestamp = Date.now();
      const newRequest = {
        type: 'admin_visit' as const,
        visitorName: `Submit Test ${timestamp}`,
        visitorIdType: 'national_id' as const,
        visitorIdNumber: `SUB${timestamp}`,
        visitorCompany: 'Submit Company',
        siteId: 1,
        startDate: '2025-01-15',
        endDate: '2025-01-15',
        purpose: 'Submit immediately test',
        zoneIds: [2],
        submitImmediately: true,
      };
      
      const result = await caller.requests.create(newRequest);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('pending_l1');
    });
  });

  describe('approval workflow', () => {
    it('should approve L1 and move to pending_manual', async () => {
      // Create a fresh request with submitImmediately to start in pending_l1
      const timestamp = Date.now();
      const newRequest = await caller.requests.create({
        type: 'work_permit' as const,
        visitorName: `L1 Approve Test ${timestamp}`,
        visitorIdType: 'passport' as const,
        visitorIdNumber: `PASS${timestamp}`,
        visitorCompany: 'Workflow Test Co',
        siteId: 1,
        startDate: '2025-01-20',
        endDate: '2025-01-20',
        purpose: 'L1 approval testing',
        zoneIds: [2],
        submitImmediately: true,
      });
      
      const result = await caller.requests.approveL1({ id: newRequest.id });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Verify the request status changed
      const updated = await caller.requests.getById({ id: newRequest.id });
      expect(updated?.status).toBe('pending_manual');
    });

    it('should approve manual and complete the request', async () => {
      // Create a fresh request with submitImmediately and approve L1 first
      const timestamp = Date.now();
      const newRequest = await caller.requests.create({
        type: 'mop' as const,
        visitorName: `Manual Approve Test ${timestamp}`,
        visitorIdType: 'passport' as const,
        visitorIdNumber: `MAN${timestamp}`,
        visitorCompany: 'Manual Test Co',
        siteId: 1,
        startDate: '2025-01-21',
        endDate: '2025-01-21',
        purpose: 'Manual approval testing',
        zoneIds: [2],
        submitImmediately: true,
      });
      
      // First approve L1
      await caller.requests.approveL1({ id: newRequest.id });
      
      // Then approve manual
      const result = await caller.requests.approveManual({
        id: newRequest.id,
        entryMethod: 'manual',
        comments: 'Test approval',
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Verify the request status changed
      const updated = await caller.requests.getById({ id: newRequest.id });
      expect(updated?.status).toBe('approved');
    });
  });

  describe('rejection workflow', () => {
    it('should reject at L1 level', async () => {
      // Create a fresh request with submitImmediately for rejection testing
      const timestamp = Date.now();
      const newRequest = await caller.requests.create({
        type: 'tep' as const,
        visitorName: `Reject Test ${timestamp}`,
        visitorIdType: 'iqama' as const,
        visitorIdNumber: `IQ${timestamp}`,
        siteId: 1,
        startDate: '2025-01-25',
        endDate: '2025-01-25',
        purpose: 'Rejection testing',
        zoneIds: [2],
        submitImmediately: true,
      });
      
      const result = await caller.requests.rejectL1({
        id: newRequest.id,
        comments: 'Test rejection - invalid documentation',
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Verify the request status changed
      const updated = await caller.requests.getById({ id: newRequest.id });
      expect(updated?.status).toBe('rejected');
    });
  });
});
