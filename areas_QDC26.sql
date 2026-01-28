INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Gate', 'QDC26_GF_Building_Gate', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Main Gate', 'QDC26_GF_Main_Gate', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Employee Office', 'QDC26_GF_Employee_Office', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'QDC26_0_1', 'QDC26_GF_QDC26_0_1', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'QDC26_0_2', 'QDC26_GF_QDC26_0_2', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'QDC26_0_3', 'QDC26_GF_QDC26_0_3', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'QDC26_0_4', 'QDC26_GF_QDC26_0_4', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'QDC26_0_A-MMR', 'QDC26_GF_QDC26_0_A_MMR', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'QDC26_0_B-MMR', 'QDC26_GF_QDC26_0_B_MMR', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'QDC26_0_C-MMR', 'QDC26_GF_QDC26_0_C_MMR', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'QDC26_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'QDC26_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Rooftop', 'QDC26_Others_Rooftop', id, 'active' FROM zones WHERE code = 'QDC26_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'QDC26_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'QDC26_Others';