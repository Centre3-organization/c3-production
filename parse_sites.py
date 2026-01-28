import pandas as pd
import json

# Read the Excel file
df = pd.read_excel('/home/ubuntu/upload/ExcelFile.xlsx', header=None)

# The sites are listed in the summary section (columns 25-27)
# Let's extract the site names from the data

# Sites from the summary section (right side of Excel)
sites_data = []

# Parse the summary section (columns 25-27: No., Region, Site, City)
for i in range(2, 20):  # Rows with site data
    row = df.iloc[i]
    if pd.notna(row[24]) and str(row[24]).strip().isdigit():
        site_info = {
            'region': str(row[25]).strip() if pd.notna(row[25]) else '',
            'site': str(row[26]).strip() if pd.notna(row[26]) else '',
            'city': str(row[27]).strip() if pd.notna(row[27]) else ''
        }
        if site_info['site']:
            sites_data.append(site_info)
    # Also check for sites without numbers (continuation)
    elif pd.notna(row[26]) and str(row[26]).strip():
        site_name = str(row[26]).strip()
        if site_name and not site_name.startswith('Site') and site_name not in ['Central', 'Eastern', 'Western']:
            # Get region from previous entry
            region = sites_data[-1]['region'] if sites_data else ''
            city = str(row[27]).strip() if pd.notna(row[27]) else ''
            sites_data.append({
                'region': region,
                'site': site_name,
                'city': city
            })

print("=== SITES FROM SUMMARY ===")
for s in sites_data:
    print(f"{s['region']} - {s['site']} ({s['city']})")

# Now let's extract the detailed zones and areas from the main data sections
# Central region: columns 1-8
# Eastern region: columns 10-15
# Western region: columns 17-22

def extract_site_data(df, start_col, site_col, gf_col, f1_col, f2_col, f3_col, others_col, region):
    """Extract site data from a region section"""
    sites = []
    current_site = None
    current_zones = {'GF': [], '1F': [], '2F': [], '3F': [], 'Others': []}
    
    for i in range(2, len(df)):
        row = df.iloc[i]
        
        # Check if this is a new site row (has a number in the first column)
        site_num = row[start_col]
        site_name = row[site_col]
        
        if pd.notna(site_num) and str(site_num).strip().isdigit():
            # Save previous site if exists
            if current_site:
                sites.append({
                    'name': current_site,
                    'region': region,
                    'zones': current_zones.copy()
                })
            
            current_site = str(site_name).strip() if pd.notna(site_name) else None
            current_zones = {'GF': [], '1F': [], '2F': [], '3F': [], 'Others': []}
        
        # Extract areas for each zone
        if current_site:
            gf_val = row[gf_col] if gf_col < len(row) else None
            f1_val = row[f1_col] if f1_col < len(row) else None
            f2_val = row[f2_col] if f2_col is not None and f2_col < len(row) else None
            f3_val = row[f3_col] if f3_col is not None and f3_col < len(row) else None
            others_val = row[others_col] if others_col < len(row) else None
            
            if pd.notna(gf_val) and str(gf_val).strip():
                current_zones['GF'].append(str(gf_val).strip())
            if pd.notna(f1_val) and str(f1_val).strip():
                current_zones['1F'].append(str(f1_val).strip())
            if f2_val is not None and pd.notna(f2_val) and str(f2_val).strip():
                current_zones['2F'].append(str(f2_val).strip())
            if f3_val is not None and pd.notna(f3_val) and str(f3_val).strip():
                current_zones['3F'].append(str(f3_val).strip())
            if pd.notna(others_val) and str(others_val).strip():
                current_zones['Others'].append(str(others_val).strip())
    
    # Don't forget the last site
    if current_site:
        sites.append({
            'name': current_site,
            'region': region,
            'zones': current_zones.copy()
        })
    
    return sites

# Extract Central region sites (columns 1-8)
central_sites = extract_site_data(df, 1, 2, 3, 4, 5, 6, 7, 'Central')

# Extract Eastern region sites (columns 10-15)
eastern_sites = extract_site_data(df, 10, 11, 12, 13, None, None, 14, 'Eastern')

# Extract Western region sites (columns 17-22)
western_sites = extract_site_data(df, 17, 18, 19, 20, None, None, 21, 'Western')

all_sites = central_sites + eastern_sites + western_sites

print("\n=== DETAILED SITE DATA ===")
for site in all_sites:
    print(f"\n{site['region']} - {site['name']}:")
    for zone, areas in site['zones'].items():
        if areas:
            print(f"  {zone}: {areas}")

# Save to JSON for database insertion
output = {
    'sites': all_sites,
    'summary': sites_data
}

with open('/home/ubuntu/centre3-prod/sites_data.json', 'w') as f:
    json.dump(output, f, indent=2)

print("\n\nData saved to sites_data.json")
print(f"Total sites found: {len(all_sites)}")
