import json

# Read the parsed data
with open('/home/ubuntu/centre3-prod/sites_data.json', 'r') as f:
    data = json.load(f)

sites = data['sites']

# Zone key mapping
zone_keys = {
    'GF': 'GF',
    '1F': '1F',
    '2F': '2F',
    '3F': '3F',
    'Others': 'Others'
}

# Generate area inserts grouped by site
area_batches = {}

for site in sites:
    site_code = site['name']
    
    for zone_key, areas in site['zones'].items():
        if not areas:
            continue
            
        zone_code = f"{site_code}_{zone_key}"
        
        if site_code not in area_batches:
            area_batches[site_code] = []
        
        for area_name in areas:
            area_name_clean = area_name.replace("'", "''")
            area_code = f"{site_code}_{zone_key}_{area_name}".replace(' ', '_').replace('-', '_').replace("'", "")[:50]
            
            area_batches[site_code].append(f"""INSERT INTO areas (name, code, zoneId, status)
SELECT '{area_name_clean}', '{area_code[:50]}', id, 'active' FROM zones WHERE code = '{zone_code}';""")

# Write each site's areas to separate files
for site_code, inserts in area_batches.items():
    with open(f'/home/ubuntu/centre3-prod/areas_{site_code}.sql', 'w') as f:
        f.write('\n'.join(inserts))
    print(f"{site_code}: {len(inserts)} areas")

print(f"\nTotal sites: {len(area_batches)}")
print(f"Total areas: {sum(len(v) for v in area_batches.values())}")
