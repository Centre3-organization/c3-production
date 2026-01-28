INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Gate', 'MDC20_GF_Building_Gate', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Main Gate', 'MDC20_GF_Main_Gate', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Employee Office', 'MDC20_GF_Employee_Office', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'MDC20_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MDC20_0_1', 'MDC20_GF_MDC20_0_1', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MDC20_0_2', 'MDC20_GF_MDC20_0_2', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MDC20_0_3', 'MDC20_GF_MDC20_0_3', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MDC20_0_4', 'MDC20_GF_MDC20_0_4', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MDC20_0_A-MMR', 'MDC20_GF_MDC20_0_A_MMR', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MDC20_0_B-MMR', 'MDC20_GF_MDC20_0_B_MMR', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MDC20_0_C-MMR', 'MDC20_GF_MDC20_0_C_MMR', id, 'active' FROM zones WHERE code = 'MDC20_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Rooftop', 'MDC20_Others_Rooftop', id, 'active' FROM zones WHERE code = 'MDC20_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'MDC20_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'MDC20_Others';