import json
import os

# Read the parsed data
with open('/home/ubuntu/centre3-prod/sites_data.json', 'r') as f:
    data = json.load(f)

sites = data['sites']

# Zone names mapping for readability
zone_names = {
    'GF': 'Ground Floor',
    '1F': 'First Floor',
    '2F': 'Second Floor',
    '3F': 'Third Floor',
    'Others': 'Other Areas'
}

# Generate SQL for zones
zone_inserts = []
area_inserts = []

for site in sites:
    site_code = site['name']
    
    for zone_key, areas in site['zones'].items():
        if not areas:  # Skip empty zones
            continue
            
        zone_readable = zone_names.get(zone_key, zone_key)
        zone_code = f"{site_code}_{zone_key}"
        
        # Zone insert with subquery for siteId
        zone_inserts.append(f"""INSERT INTO zones (name, code, siteId, accessPolicy, securityLevel, status)
SELECT '{zone_readable}', '{zone_code}', id, 'open', 'medium', 'active' FROM sites WHERE code = '{site_code}';""")
        
        # Area inserts for each area in this zone
        for area_name in areas:
            # Clean area name for SQL
            area_name_clean = area_name.replace("'", "''")
            area_code = f"{site_code}_{zone_key}_{area_name}".replace(' ', '_').replace('-', '_').replace("'", "")[:50]
            
            area_inserts.append(f"""INSERT INTO areas (name, code, zoneId, status)
SELECT '{area_name_clean}', '{area_code[:50]}', id, 'active' FROM zones WHERE code = '{zone_code}';""")

print(f"Generated {len(zone_inserts)} zone inserts")
print(f"Generated {len(area_inserts)} area inserts")

# Write to SQL files
with open('/home/ubuntu/centre3-prod/zones.sql', 'w') as f:
    f.write('\n'.join(zone_inserts))

with open('/home/ubuntu/centre3-prod/areas.sql', 'w') as f:
    f.write('\n'.join(area_inserts))

print("\nSQL files created:")
print("- zones.sql")
print("- areas.sql")

# Print sample
print("\n=== Sample Zone SQL ===")
for sql in zone_inserts[:3]:
    print(sql)
    print()

print("\n=== Sample Area SQL ===")
for sql in area_inserts[:3]:
    print(sql)
    print()
