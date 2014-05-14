import pandas as pd
import numpy as np
import re

def add_moe_vars(rename_dict):
    """
    Takes a renaming dictionary and adds the MOE versions of the census variables.
    """
    res = dict()
    for old, new in rename_dict.items():
        m = re.match('HC0([13])_(.*)', old)
        if m:
            old_moe = 'HC0' + str(int(m.groups()[0]) + 1) + '_' + m.groups()[1]
            new_moe = new + '_moe'
            res[old_moe] = new_moe
    return dict(list(rename_dict.items()) + list(res.items()))

df = pd.DataFrame()
dp2 = pd.read_csv('census_download/ACS_12_5YR_DP02_with_ann.csv')
dp3 = pd.read_csv('census_download/ACS_12_5YR_DP03_with_ann.csv')
dp4 = pd.read_csv('census_download/ACS_12_5YR_DP04_with_ann.csv')
dp5 = pd.read_csv('census_download/ACS_12_5YR_DP05_with_ann.csv')

dp2_cols = {
    'GEO.id2': 'tract_id',
    'HC01_VC03': 'hh', # total count of households
    'HC03_VC17': 'hh_youth_pct', # percent of HHs with 1+ people < 18 y. o.
    'HC03_VC18': 'hh_old_pct', # percent of HHs with 1+ people >= 65 y.o.
    'HC01_VC25': 'hh_pop', # population in HHs
    'HC01_VC20': 'hh_size', # avg. size of HHs
    'HC03_VC51': 'fertility', # percent of women 15-50 who had birth in last 12 mo.
    'HC03_VC75': 'school_pct', # percent of pop 3+ y. o. enrolled in school
    'HC03_VC93': 'hs_grad_pct', # percent of pop 25+ y.o. w/ HS degree/GED or higher
    'HC03_VC94': 'ba_grad_pct', # percent of pop 25+ yo w/ BA or higher
    'HC03_VC104': 'disab_pct', # percent of pop with disability
    'HC03_VC118': 'same_house_pct', # percent of pop living in same house 1 yr. ago
    'HC03_VC134': 'foreign_pct', # percent of pop foreign born
    'HC03_VC140': 'noncitizen_pct', # percent of non-US Citizens
    'HC03_VC168': 'nonenglish_pct', # percent of pop who don't English at home
    'HC03_VC170': 'badenglish_pct', # percent of pop who speak English less than "very well"
}
dp2_cols = add_moe_vars(dp2_cols)
dp2 = dp2[dp2_cols.keys()].rename(columns = dp2_cols)

dp3_cols = {
    'GEO.id2': 'tract_id',
    'HC03_VC13': 'unemp_pct', # pct of pop 16+ yo unemployed
    'HC01_VC85': 'med_hh_inc', # median HH income + benefits, 2012 dollars
    'HC01_VC86': 'mean_hh_inc', # mean HH income + benefits, 2012$
    'HC03_VC128': 'health_ins_pct', # pct of civ noninst. pop with health ins.
    'HC03_VC156': 'poverty_pct', # pct. of families below poverty line
}
dp3_cols = add_moe_vars(dp3_cols)
dp3 = dp3[dp3_cols.keys()].rename(columns = dp3_cols)

dp4_cols = {
    'GEO.id2': 'tract_id',
    'HC03_VC08': 'rent_vacancy_pct', # rental vacancy rate
    'HC01_VC48': 'med_rooms_per_hh', # median number of rooms per HH
    'HC03_VC72': 'moved_in_post_2010_pct', # pct of HH moved in since 2010 (IN 2012)
    'HC03_VC82': 'no_car_pct', # percent of HH with no vehicle available
    'HC03_VC112': 'crowded_pct', # percent with > 1.5 occupants per room
    'HC01_VC125': 'med_housing_value', # median housing value
    'HC03_VC177': 'occ_rent_pct', # percent of occupied units paying rent
    'HC03_VC160': 'unaff_mortgage_pct', # pct of mortgaged HUs with owner costs >= 35% of HH income
    'HC03_VC197': 'unaff_rent_pct', # pct of occ. rent units with gross rent >= 35% of HH income
}
dp4_cols = add_moe_vars(dp4_cols)
dp4 = dp4[dp4_cols.keys()].rename(columns = dp4_cols)


dp5_cols = {
    'GEO.id2': 'tract_id',
    'HC03_VC72': 'white_pct', # pct of pop. ided as white (in addition to other races)
    'HC03_VC73': 'afam_pct', # pct of pop. ided as Af. Am.
    'HC03_VC75': 'asian_pct', # pct of population IDed as Asian
    'HC03_VC81': 'hisp_pct', # pct hispanic (of any race)
}
dp5_cols = add_moe_vars(dp5_cols)
dp5 = dp5[dp5_cols.keys()].rename(columns = dp5_cols)


merged = pd.merge(dp2, dp3, on='tract_id')
merged = pd.merge(merged, dp4, on='tract_id')
merged = pd.merge(merged, dp5, on='tract_id')

merged.to_csv('census_merged.csv')
