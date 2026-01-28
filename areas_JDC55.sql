INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Gate', 'JDC55_GF_Building_Gate', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Main Gate', 'JDC55_GF_Main_Gate', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Employee Office', 'JDC55_GF_Employee_Office', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'JDC55_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'JDC55_0_1', 'JDC55_GF_JDC55_0_1', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'JDC55_0_2', 'JDC55_GF_JDC55_0_2', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'JDC55_0_3', 'JDC55_GF_JDC55_0_3', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'JDC55_0_4', 'JDC55_GF_JDC55_0_4', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'JDC55_0_A-MMR', 'JDC55_GF_JDC55_0_A_MMR', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'JDC55_0_B-MMR', 'JDC55_GF_JDC55_0_B_MMR', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'JDC55_0_C-MMR', 'JDC55_GF_JDC55_0_C_MMR', id, 'active' FROM zones WHERE code = 'JDC55_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Rooftop', 'JDC55_Others_Rooftop', id, 'active' FROM zones WHERE code = 'JDC55_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'JDC55_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'JDC55_Others';