from src.scraper import core_tabelog_information
from bs4 import BeautifulSoup
from src.utils import check_master_records, add_to_records, combine_two_dictionaries, load_restaurant_json
from src.GoogleApi import request_information


#this is effectively someone pasting a link, so requesting details 
with open('./tests/test2.html', 'r', encoding='utf-8') as f: #Opening our test file using encoding for japanese characters
    tabelogData = f.read()
    soup = BeautifulSoup(tabelogData, 'html.parser') #Soup object for scraping with beautifulsoup

tabe_info = core_tabelog_information(soup)
if tabe_info: #If we pulled the tabelog info 
    tabe_url = tabe_info.get("URL") #Here's the url 
    restaurant_info = check_master_records(tabe_url)#Check if we have that url
    if restaurant_info:#if we have that url,if we do, we are given the json file as the return 
        print(restaurant_info) 
    else:
        #if we dont have url
        google_details_json = request_information(tabe_info)#our google json/dict
        json_to_add = combine_two_dictionaries("Tabelog", "Google", tabe_info, google_details_json)
        check = add_to_records(json_to_add)
        if check:
            print("Oingo boingo")






