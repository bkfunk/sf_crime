import numpy as np
import pandas as pd
import os, sys
from glob import glob
from datetime import datetime

sfpd = pd.DataFrame() # empty DataFrame


# Change to directory of this file
os.chdir(os.path.dirname(os.path.realpath(__file__)))
# Get list of all CSV files
if len(sys.argv) > 1:
  incident_csvs = glob("geocoded/*" + sys.argv[1] + ".csv")
else:
  incident_csvs = glob("geocoded/*.csv")

nfiles = 0
for file in (incident_csvs):
  # Read in csv file and concat to our working DataFrame
  print("Reading in file: %s" % file)
  try:
    # Note: we set ignore_index=True because we don't care about the obs.'s
    # index in the original file
    sfpd = pd.concat([sfpd, pd.read_csv(file)], ignore_index=True)
  except:
    print("Error reading file: %s" % file)
  else:
    nfiles += 1  
  
print("Read in %d files" % nfiles)

# Get census tract, which is just the first 10 characters of the FIPS code
sfpd['tract_id'] = sfpd.block_fips.map(lambda x: int(str(x)[0:10]))

# Describe dataset
"""
In [24]: sfpd.info()
<class 'pandas.core.frame.DataFrame'>
Int64Index: 930315 entries, 0 to 930314
Data columns (total 15 columns):
Category      930315  non-null values
Date          930315  non-null values
DayOfWeek     930315  non-null values
Descript      930315  non-null values
IncidntNum    930315  non-null values
Location      930315  non-null values
PdDistrict    930315  non-null values
Resolution    930315  non-null values
Time          930315  non-null values
Unnamed: 0    930315  non-null values
X             930315  non-null values
Y             930315  non-null values
block_fips    930315  non-null values
datetime      930315  non-null values
i             930315  non-null values
dtypes: float64(2), int64(4), object(9)
"""

# Let's look at the different SFPD categories
"""
In [16]: sfpd.Category.value_counts()
Out[16]:
LARCENY/THEFT                  197583
OTHER OFFENSES                 136346
NON-CRIMINAL                    97134
ASSAULT                         80567
DRUG/NARCOTIC                   63504
VANDALISM                       52458
WARRANTS                        45639
VEHICLE THEFT                   40177
BURGLARY                        39110
MISSING PERSON                  30744
SUSPICIOUS OCC                  29695
ROBBERY                         27137
FRAUD                           17967
FORGERY/COUNTERFEITING          10331
WEAPON LAWS                      8613
TRESPASS                         7421
PROSTITUTION                     6654
RECOVERED VEHICLE                5382
DRUNKENNESS                      5287
DISORDERLY CONDUCT               5157
SEX OFFENSES, FORCIBLE           4384
DRIVING UNDER THE INFLUENCE      3059
KIDNAPPING                       2808
LIQUOR LAWS                      2368
RUNAWAY                          2084
STOLEN PROPERTY                  2041
ARSON                            1624
LOITERING                        1488
EMBEZZLEMENT                     1267
SUICIDE                           623
FAMILY OFFENSES                   394
BAD CHECKS                        382
EXTORTION                         357
BRIBERY                           188
SEX OFFENSES, NON FORCIBLE        162
GAMBLING                          157
PORNOGRAPHY/OBSCENE MAT            23
dtype: int64
"""

# "Other Offenses" are the #2 cagtegory. Let's break that down:
"""
n [34]: sfpd[sfpd.Category == "OTHER OFFENSES"].Descript.value_counts()
Out[34]:
DRIVERS LICENSE, SUSPENDED OR REVOKED                32342
TRAFFIC VIOLATION                                    18665
MISCELLANEOUS INVESTIGATION                          10503
RESISTING ARREST                                     10432
PROBATION VIOLATION                                  10387
TRAFFIC VIOLATION ARREST                              6887
LOST/STOLEN LICENSE PLATE                             6546
PAROLE VIOLATION                                      6339
VIOLATION OF RESTRAINING ORDER                        5141
CONSPIRACY                                            4127
VIOLATION OF MUNICIPAL CODE                           2797
POSSESSION OF BURGLARY TOOLS                          2694
HARASSING PHONE CALLS                                 2641
OBSCENE PHONE CALLS(S)                                2400
VIOLATION OF MUNICIPAL POLICE CODE                    1884
FALSE EVIDENCE OF VEHICLE REGISTRATION                1273
MISCELLANEOUS STATE MISDEMEANOR                       1146
TAMPERING WITH A VEHICLE                               997
OBSTRUCTIONS ON STREETS/SIDEWALKS                      901
FAILURE TO REGISTER AS SEX OFFENDER                    792
DANGER OF LEADING IMMORAL LIFE                         684
INDECENT EXPOSURE                                      533
INJURY TO TELEGRAPH/TELEPHONE LINES                    484
PEDDLING WITHOUT A LICENSE                             445
RECKLESS DRIVING                                       421
ACTS AGAINST PUBLIC TRANSIT                            395
OPERATING TAXI WITHOUT A PERMIT                        360
VIOLATION OF PARK CODE                                 359
BEYOND PARENTAL CONTROL                                312
MISCELLANEOUS STATE FELONY                             269
FALSE REPORT OF BOMB                                   260
CONTRIBUTING TO THE DELINQUENCY OF MINOR               257
AGGRESSIVE SOLICITING                                  252
DISRUPTS SCHOOL ACTIVITIES                             222
DEFRAUDING TAXI DRIVER                                 214
CRUELTY TO ANIMALS                                     171
FALSE REPORT OF CRIME                                  130
INTOXICATED JUVENILE                                   125
THROWING SUBSTANCE AT VEHICLE                          121
HABITUAL TRUANT                                        112
SPEEDING                                               106
POSSESSION OF FIRECRACKERS                             103
FALSE FIRE ALARM                                        95
OPEN CONTAINER OF ALCOHOL IN VEHICLE                    94
FAILURE TO HEED RED LIGHT AND SIREN                     75
INTERFERRING WITH A POLICE OFFICER                      70
PLACING TRASH ON THE STREET                             69
DUMPING OF OFFENSIVE MATTER                             60
SELLING/DISCHARGING OF FIRECRACKERS                     59
SPITTING ON SIDEWALK                                    44
PEEPING TOM                                             42
ADVERTISING DISTRIBUTORS PERMIT VIOLATION               42
PERJURY                                                 41
VIOLATION OF FEDERAL STATUTE                            38
VIOLATION OF FIRE CODE                                  36
INDECENT EXPOSURE WITH PRIOR CONVICTION                 35
AID OR HARBOR FELON                                     28
DRIVES VEHICLE ALONG TRACK OF RAILROAD                  25
POSSESSION OF ARTICLES WITH IDENTIFICATION REMOVE       23
OPERATING WITHOUT CABARET PERMIT                        20
SOLICITING COMMISSION OF A CRIME                        18
TAMPERING WITH MAIL                                     18
FORTUNE TELLING                                         17
ESCAPEE, JUVENILE                                       17
DISPLAY & SALE OF SPRAY PAINT & MARKER PENS             15
SALE OF SATELLITE TELEPHONE NUMBER                      12
TAKING CONTRABAND INTO A REFORMATORY                    11
CURFEW VIOLATION                                        11
OPERATING WITHOUT DANCEHALL PERMIT                      10
POISONING ANIMALS                                        9
HEATING VIOLATION  APT/HOTEL                             9
ESCAPE FROM JAIL                                         9
JUVENILE PAROLE VIOLATOR                                 8
INTERFERRING WITH A FIREMAN                              7
AFFIXING ADVERTISMENTS TO POLES                          6
OVERCHARGING TAXI FARE                                   5
ABORTION                                                 5
ESCAPE OF PRISONER WHILE HOSPITALIZED                    5
RESCUING PRISONER FROM LAWFUL CUSTODY                    5
SELLING RESTRICTED GLUE TO JUVENILES                     4
UNAUTHORIZED USE OF LOUD SPEAKERS                        4
JUDGE/JUROR ACCEPTING A BRIBE                            4
VIOLATION OF STATE LABOR CODE                            4
ILLEGAL CHARITABLE SOLICITATIONS                         3
WEARING THE APPAREL OF OPPOSITE SEX TO DECEIVE           2
ESCAPE FROM HOSPITAL WITH FORCE                          1
DESTITUTE MINOR                                          1
INJURY TO RAILROADS/RAILROAD BRIDGES                     1
Length: 88, dtype: int64
"""

# Create date variables
sfpd.datetime = pd.to_datetime(sfpd.datetime)
sfpd['year'] = sfpd.datetime.apply(lambda x: x.year)
sfpd['month'] = sfpd.datetime.apply(lambda x: x.month)

# Create resolution dummies
sfpd['incident'] = True # all incidents
sfpd['resolved'] = ~sfpd.Resolution.isin(['NONE']) # NOT equal to NONE
sfpd['arrested'] = sfpd.Resolution.isin(['ARREST, BOOKED','JUVENILE BOOKED'])
sfpd['cited'] = sfpd.Resolution.isin(['ARREST, CITED','JUVENILE CITED'])

# Keep only if year = 2012, year of our census data

sfpd12 = sfpd[sfpd.year == 2012]
# Cut to relevant variables
sfpd12 = sfpd12[['Category','year','tract_id','resolved','incident','arrested','cited']]
# Add dummy category varieabls
sfpd12 = sfpd12.join(pd.get_dummies(sfpd12.Category))

g_inc = sfpd12[sfpd12.incident == True].groupby(['tract_id'])

g_res = sfpd12[sfpd12.resolved == True].groupby(['tract_id'])

g_arr = sfpd12[sfpd12.arrested == True].groupby(['tract_id'])

g_cit = sfpd12[sfpd12.cited == True].groupby(['tract_id'])

census = pd.read_csv('census_merged.csv')

inc = pd.merge(g_inc.sum().reset_index(), census, on='tract_id')
res = pd.merge(g_res.sum().reset_index(), census, on='tract_id')
arr = pd.merge(g_arr.sum().reset_index(), census, on='tract_id')

# Take columns for counts and create rates
def create_rates(df, columns, denom='hh_pop', per=1000, lower=True):
  for c in columns:
    if lower:
      new = str.lower(c) + " (rate)"
    else:
      new = c + " (rate)"
    df[new] = df[c] / (df[denom] / float(per))

# Remove columns whose mean below a certain rate
def remove_insig_cols(df, columns, threshold=0.1):
  to_drop = df[columns].apply(lambda x: x.mean() < threshold, axis=0)
  print("Dropping columns:")
  print(to_drop[to_drop])
  return df.drop(df[to_drop[to_drop].index], axis=1)

# Create rates for category counts, i.e. cols that are all caps (plus punct)
def clean_misc(df, threshold=0.1):
  create_rates(df, df.filter(regex='^[A-Z ,.-/]+$'))
  return remove_insig_cols(df, df.filter(like="(rate)").columns, threshold)
  
inc = clean_misc(inc)
res = clean_misc(res, 0.05)
arr = clean_misc(arr, 0.01)

inc.to_csv('inc_2012.csv')
res.to_csv('res_2012.csv')
arr.to_csv('arr_2012.csv')