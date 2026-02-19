import json
from bs4 import BeautifulSoup

def extract_substring_between(start_substring: str, end_substring: str , text : str = "",) -> str: #Maybe future proof this 
    """ Extracts a substring between two given substring markers and given a given string """ 

    temporary_container = text.split(start_substring)
    temporary_container = temporary_container[1].split(end_substring)
    target_substring = temporary_container[0]
    return target_substring #Returns target substring   

def check_master_records(url: str) -> dict | None:
    """This method takes a string (Tabelog URL JP) and checks if it exists in my master records
    Method will return none if the place is not on my records, otherwise it returns the json data for that restaurant"""

    try:
        with open('./data/url_map.json', 'r', encoding='utf-8') as json_data: #Opening our master file
            master_table = json.load(json_data) #Loading it as a dictionary in python 
            place_id = master_table.get(url)#Does it exist? if so place_id is the place_id 
    except FileNotFoundError:
        print("File not found")
        return None
    

    if place_id:#if it does, lets return the json file. 
        restaurant_info = load_restaurant_json(place_id)       
        return restaurant_info
    else: #if it doesn't exist, let's add it to our records
        return None
        
def combine_two_dictionaries(dict_name1: str, dict_name2: str, dict1: dict, dict2: dict) -> dict:
    """Given two dictionaries and their names, this function will combine them into a new dictionary with the format below"""
    combined_dict = {dict_name1:dict1,
                     dict_name2:dict2
    }
    return combined_dict



def load_restaurant_json(google_id: str) -> dict:
    """
    Given a google ID it will return the information for that restaurant
    Currently it loads the local json file for that restaurant.
    """
    file_path = f"./data/master_cache/{google_id}.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        restaurant_info = json.load(f)

    return restaurant_info



def add_to_records(combined_dict) -> None:
    """Saves a local json file with the new restaurant information
        Updates our master list to prevent adding the same restaurant twice
    """
    
    tabelog_url = combined_dict["Tabelog"]["url"] 
    google_id = combined_dict["Google"]["id"]


    file_path = f"./data/master_cache/{google_id}.json"

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(combined_dict, f, ensure_ascii=False, indent=4)

    

    add_to_tracker(tabelog_url, google_id)
    

def add_to_tracker(tabelog_url: str, google_id: str) -> None:
    """Updates the url_map tracker with the new restaurant google_id and tabelog url"""
    
    with open("./data/url_map.json", 'r', encoding='utf-8') as f:                     #Updating the master tracker, we do read and write separately as json sucks sometimes
        url_map = json.load(f)
    
     
    url_map[tabelog_url] = google_id                                                  #Add the new link
    
    
    with open("./data/url_map.json", 'w', encoding='utf-8') as f:                     #Save the updated map back to disk
        json.dump(url_map, f, ensure_ascii=False, indent=4)
        
    
def load_schema(schema_name: str) -> dict:
    """This will function will load a json schema up from the schemas folder and return it as a python dict"""

    with open(f'./schemas/{schema_name}.json', 'r', encoding='utf-8') as f:                                                                                   
            schema_as_json =  json.load(f)

    return schema_as_json

def load_html(file_path : str) -> BeautifulSoup:
    """Given a html file path, it will load it and return it as a BeautifulSoup """

    with open(f'{file_path}.html', 'r', encoding='utf-8') as f:                     #Opening our test file using encoding for japanese characters
        tabelogData = f.read()
        soup = BeautifulSoup(tabelogData, 'html.parser') 

    return soup


