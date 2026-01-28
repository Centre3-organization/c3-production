INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Gate', 'DDC21_GF_Building_Gate', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Main Gate', 'DDC21_GF_Main_Gate', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Employee Office', 'DDC21_GF_Employee_Office', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'DDC21_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_0_A-ER', 'DDC21_GF_DDC21_0_A_ER', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_0_A-TR', 'DDC21_GF_DDC21_0_A_TR', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_0_B-ER', 'DDC21_GF_DDC21_0_B_ER', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_0_B-TR', 'DDC21_GF_DDC21_0_B_TR', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_0_B', 'DDC21_GF_DDC21_0_B', id, 'active' FROM zones WHERE code = 'DDC21_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_1_B', 'DDC21_1F_DDC21_1_B', id, 'active' FROM zones WHERE code = 'DDC21_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_1_B-TR', 'DDC21_1F_DDC21_1_B_TR', id, 'active' FROM zones WHERE code = 'DDC21_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_1_A', 'DDC21_1F_DDC21_1_A', id, 'active' FROM zones WHERE code = 'DDC21_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'DDC21_1_A-TR', 'DDC21_1F_DDC21_1_A_TR', id, 'active' FROM zones WHERE code = 'DDC21_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Rooftop', 'DDC21_Others_Rooftop', id, 'active' FROM zones WHERE code = 'DDC21_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'DDC21_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'DDC21_Others';