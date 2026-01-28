INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Gate', 'RDC05_GF_Building_Gate', id, 'active' FROM zones WHERE code = 'RDC05_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Main Gate', 'RDC05_GF_Main_Gate', id, 'active' FROM zones WHERE code = 'RDC05_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC05_DH', 'RDC05_GF_RDC05_DH', id, 'active' FROM zones WHERE code = 'RDC05_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'RDC05_NW', 'RDC05_GF_RDC05_NW', id, 'active' FROM zones WHERE code = 'RDC05_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Loading Area', 'RDC05_GF_Loading_Area', id, 'active' FROM zones WHERE code = 'RDC05_GF';
INSERT INTO areas (name, code, zoneId, status)
SELECT 'Building Facilities', 'RDC05_Others_Building_Facilities', id, 'active' FROM zones WHERE code = 'RDC05_Others';