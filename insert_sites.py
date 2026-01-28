import json
import subprocess

# Read the parsed data
with open('/home/ubuntu/centre3-prod/sites_data.json', 'r') as f:
    data = json.load(f)

sites = data['sites']

# City mapping based on the summary
city_mapping = {
    'RDC46': 'Riyadh',
    'RDC05': 'Riyadh',
    'RDC301': 'Riyadh',
    'ITCC': 'Riyadh',
    'RDCKAFD': 'Riyadh',
    'RDC102': 'Riyadh',
    'RDC103': 'Riyadh',
    'RDC104': 'Riyadh',
    'DDC21': 'Dammam',
    'DDC352': 'Dammam',
    'DDC371': 'Dammam',
    'QDC26': 'Qassim',
    'JDC04': 'Jeddah',
    'JDC55': 'Jeddah',
    'JDC203': 'Jeddah',
    'MDC20': 'Madinah',
    'MKDC34': 'Makkah'
}

# Generate SQL statements
sql_statements = []

# First, insert all sites
print("=== INSERTING SITES ===")
for site in sites:
    site_name = site['name']
    region = site['region']
    city = city_mapping.get(site_name, 'Riyadh')
    
    # Create a readable site name
    readable_name = f"{site_name} Data Centre"
    
    sql = f"""INSERT INTO sites (name, code, type, region, city, address, isActive) 
VALUES ('{readable_name}', '{site_name}', 'data_centre', '{region}', '{city}', '{city}, Saudi Arabia', 1);"""
    sql_statements.append(sql)
    print(f"Site: {readable_name} ({region} - {city})")

# Write SQL to file
with open('/home/ubuntu/centre3-prod/insert_sites.sql', 'w') as f:
    f.write('\n'.join(sql_statements))

print(f"\nGenerated {len(sql_statements)} site insert statements")
print("SQL saved to insert_sites.sql")

# Now generate zones and areas SQL
zone_sql = []
area_sql = []

# Zone names mapping for readability
zone_names = {
    'GF': 'Ground Floor',
    '1F': 'First Floor',
    '2F': 'Second Floor',
    '3F': 'Third Floor',
    'Others': 'Other Areas'
}

print("\n=== GENERATING ZONES AND AREAS ===")
for site in sites:
    site_name = site['name']
    site_code = site_name
    
    for zone_key, areas in site['zones'].items():
        if not areas:  # Skip empty zones
            continue
            
        zone_readable = zone_names.get(zone_key, zone_key)
        zone_code = f"{site_code}_{zone_key}"
        
        # Zone SQL - will need site ID, so we'll use a subquery
        zone_sql.append(f"""INSERT INTO zones (name, code, siteId, accessPolicy, securityLevel, securityControls, infraSpecifications, isActive)
SELECT '{zone_readable}', '{zone_code}', id, 'open', 'medium', 'none', 'none', 1 FROM sites WHERE code = '{site_code}';""")
        
        # Area SQL for each area in this zone
        for area_name in areas:
            # Clean area name for SQL
            area_name_clean = area_name.replace("'", "''")
            area_code = f"{site_code}_{zone_key}_{area_name_clean}".replace(' ', '_').replace('-', '_')[:50]
            
            area_sql.append(f"""INSERT INTO areas (name, code, zoneId, isActive)
SELECT '{area_name_clean}', '{area_code[:50]}', id, 1 FROM zones WHERE code = '{zone_code}';""")

print(f"Generated {len(zone_sql)} zone insert statements")
print(f"Generated {len(area_sql)} area insert statements")

# Write all SQL to files
with open('/home/ubuntu/centre3-prod/insert_zones.sql', 'w') as f:
    f.write('\n'.join(zone_sql))

with open('/home/ubuntu/centre3-prod/insert_areas.sql', 'w') as f:
    f.write('\n'.join(area_sql))

print("\nSQL files generated:")
print("- insert_sites.sql")
print("- insert_zones.sql")
print("- insert_areas.sql")
