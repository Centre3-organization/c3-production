INSERT INTO areas (name, code, zoneId, status)
SELECT 'Employee Office', 'RDC301_GF_Employee_Office', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'RDC301_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_1', 'RDC301_GF_RDC301_0_1', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_2', 'RDC301_GF_RDC301_0_2', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_3', 'RDC301_GF_RDC301_0_3', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_4', 'RDC301_GF_RDC301_0_4', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_A-MMR', 'RDC301_GF_RDC301_0_A_MMR', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_B-MMR', 'RDC301_GF_RDC301_0_B_MMR', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_C-MMR', 'RDC301_GF_RDC301_0_C_MMR', id, 'active' FROM zones WHERE code = 'RDC301_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_5', 'RDC301_1F_RDC301_0_5', id, 'active' FROM zones WHERE code = 'RDC301_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_6', 'RDC301_1F_RDC301_0_6', id, 'active' FROM zones WHERE code = 'RDC301_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_7', 'RDC301_1F_RDC301_0_7', id, 'active' FROM zones WHERE code = 'RDC301_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC301_0_8', 'RDC301_1F_RDC301_0_8', id, 'active' FROM zones WHERE code = 'RDC301_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'RDC301_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'RDC301_Others';