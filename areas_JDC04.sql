INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Gate', 'JDC04_GF_Building_Gate', id, 'active' FROM zones WHERE code = 'JDC04_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Main Gate', 'JDC04_GF_Main_Gate', id, 'active' FROM zones WHERE code = 'JDC04_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Employee Office', 'JDC04_GF_Employee_Office', id, 'active' FROM zones WHERE code = 'JDC04_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'JDC04_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'JDC04_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Ground Floor - Network Room', 'JDC04_GF_Ground_Floor___Network_Room', id, 'active' FROM zones WHERE code = 'JDC04_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Ground Floor - STC Computer Room', 'JDC04_GF_Ground_Floor___STC_Computer_Room', id, 'active' FROM zones WHERE code = 'JDC04_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'First Floor - Computer Room', 'JDC04_1F_First_Floor___Computer_Room', id, 'active' FROM zones WHERE code = 'JDC04_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'First Floor - Network Room', 'JDC04_1F_First_Floor___Network_Room', id, 'active' FROM zones WHERE code = 'JDC04_1F';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Utility Building', 'JDC04_Others_Utility_Building', id, 'active' FROM zones WHERE code = 'JDC04_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Transmission Room', 'JDC04_Others_Transmission_Room', id, 'active' FROM zones WHERE code = 'JDC04_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'MHS Services', 'JDC04_Others_MHS_Services', id, 'active' FROM zones WHERE code = 'JDC04_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'KAUST Computer Room', 'JDC04_Others_KAUST_Computer_Room', id, 'active' FROM zones WHERE code = 'JDC04_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Petrorabigh Computer Room', 'JDC04_Others_Petrorabigh_Computer_Room', id, 'active' FROM zones WHERE code = 'JDC04_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Operation Room', 'JDC04_Others_Operation_Room', id, 'active' FROM zones WHERE code = 'JDC04_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Rooftop', 'JDC04_Others_Rooftop', id, 'active' FROM zones WHERE code = 'JDC04_Others';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'JDC04_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'JDC04_Others';