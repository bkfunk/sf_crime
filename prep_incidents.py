import pandas as pd
import numpy as np
import json
import requests
from glob import glob
import os
import random
import sys

def coord_to_block(lat, long, index=None):
  """
  Use FCC's Census Block API to convert lat/long coordinates
  into a 15-character FIPS code for a Census Block. Also returns
  state and county.
  
  See <http://www.fcc.gov/developers/census-block-conversions-api> for details
  on API usage.
  
  Note that lat = Y and long = X for X,Y coordinates.
  
  Arguments:
  lat -- the latitude, as a float
  long -- the longitude, as a float
  
  Returns:
  A dictionary containing:
    block_fips -- FIPS code for Census Block
    county_fips -- FIPS code for county
    county_name -- name for county
    state_fips -- FIPS code for state (numeric)
    state_abbrev -- 2-letter state abbreviation (postal abberviation)
    state_name -- name of state
  or None if error of request or malformed contents.
    
  """
  url = "http://data.fcc.gov/api/block/find?latitude=%f&longitude=%f&showall=true&format=json" % (lat, long)
  r = requests.get(url)
  if index % 100 == 0:
    sys.stdout.write("%d " % index)
    sys.stdout.flush()
    
  if r.ok:
    r_dict = json.loads(r.content)
    return {'block_fips': r_dict.get('Block').get('FIPS'),
            'county_fips': r_dict.get('County').get('FIPS'),
            'county_name': r_dict.get('County').get('name'),
            'state_fips': r_dict.get('State').get('FIPS'),
            'state_abbrev': r_dict.get('State').get('code'),
            'state_name': r_dict.get('State').get('name')}
  else:
    return None

# Change to directory of this file
os.chdir(os.path.dirname(os.path.realpath(__file__)))
# Get list of all CSV files
if sys.argv[1]:
  incident_csvs = glob("sfpd_incident_all_csv/*" + sys.argv[1] + ".csv")
else:
  incident_csvs = glob("sfpd_incident_all_csv/*.csv")

df = pd.DataFrame() # empty DataFrame
nfiles = 0
for file in (incident_csvs):
  # Read in csv file and concat to our working DataFrame
  print("Reading in file: %s" % file)
  try:
    # Note: we set ignore_index=True because we don't care about the obs.'s
    # index in the original file
    df = pd.concat([df, pd.read_csv(file)], ignore_index=True)
  except:
    print("Error reading file: %s" % file)
  else:
    nfiles += 1  
  
print("Read in %d files" % nfiles)

# For testing, cut to a subset
#df_full = df
#df = df_full.ix[random.sample(df_full.index, 10)]

# Create date and time variable
df['datetime'] = pd.to_datetime(df.Date + " " + df.Time)
s = random.sample(df.index, len(df.index))

def convert_rows_and_save(frame, chunk):
  f = lambda series: coord_to_block(lat=series['Y'], long=series['X'], index=series['i']).get('block_fips')
  print("Converting lat/long to Census blocks for %d rows..." % len(frame))
  sys.stdout.flush()
  frame['block_fips'] = frame.apply(f, axis=1)
  frame.to_csv("geocoded/geocoded_%s_%d.csv" % (sys.argv[1], chunk))
  print("Done")
  
r = range(0, len(df), 10000)
r.extend([len(df)])
for i in range(1,len(r)):
  print("Converting chunk %d of %d", (i, len(r)))
  sys.stdout.flush()
  schunk = s[r[i-1]:r[i]]
  #print(df.ix[schunk].describe())
  chunk = df.ix[schunk]
  chunk['i'] = chunk.reset_index().index
  convert_rows_and_save(chunk, i)
  