INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Gate', 'MKDC34_GF_Building_Gate', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Main Gate', 'MKDC34_GF_Main_Gate', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Employee Office', 'MKDC34_GF_Employee_Office', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'MKDC34_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MKDC34_0_1', 'MKDC34_GF_MKDC34_0_1', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MKDC34_0_2', 'MKDC34_GF_MKDC34_0_2', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MKDC34_0_3', 'MKDC34_GF_MKDC34_0_3', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MKDC34_0_4', 'MKDC34_GF_MKDC34_0_4', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MKDC34_0_A-MMR', 'MKDC34_GF_MKDC34_0_A_MMR', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MKDC34_0_B-MMR', 'MKDC34_GF_MKDC34_0_B_MMR', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MKDC34_0_C-MMR', 'MKDC34_GF_MKDC34_0_C_MMR', id, 'active' FROM zones WHERE code = 'MKDC34_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Rooftop', 'MKDC34_Others_Rooftop', id, 'active' FROM zones WHERE code = 'MKDC34_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'MKDC34_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'MKDC34_Others';