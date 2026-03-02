from src.scraper import TabelogScraper as tabelog
from src.utils import check_master_records, add_to_records, combine_two_dictionaries, list_to_string, load_html, load_restaurant_json
from dotenv import load_dotenv 
import os 
from src.gemini_api import GeminiManager as gemini
from src.google_api import GooglePlacesManager as google_api
from src.supa_formatter import SupaFormatter
from supabase import create_client
from src.supa_methods import SupaMethods 
import json


def main() -> None:
    
    load_dotenv()
    ai_key = os.getenv("GEMINI_API_KEY") 
    google_key = os.getenv("GOOGLE_API_KEY")
    supa_key = os.getenv("SUPABASE_API_KEY")
    supa_url = os.getenv("SUPABASE_API_URL")
    
    if not ai_key:
        print("Error: Gemini API Key not found. Check your .env file.")
        return
    
    if not google_key:
        print("Error: google API Key not found. Check your .env file.")
        return
    
    if not supa_key:
        print("Error: Supa API Key not found. Check your .env file.")
        return
    
    if not supa_url:
        print("Error: Supa URL not found. Check your .env file.")
        return





    ai_manager = gemini(ai_key)
    google_manager = google_api(google_key)
    supabase_client = create_client(supa_url, supa_key)
    scraper = tabelog(ai_manager)
    

    


    supaa = SupaMethods(supabase_client)
    supa_format = SupaFormatter()
    json_to_supa()
            

    
    
    def json_to_supa():
        json_list = []
        supa_form = SupaFormatter()
        file_path = f"./data/url_map.json"
        with open(file_path, 'r', encoding='utf-8') as f:
            master = json.load(f)
            for value in master.values():
                json_list.append(load_restaurant_json(value))

        
        master_upload, time_upload =  supa_form.prep_supa_data(json_list)
        uploaded_master = supaa._upsert("master_restaurant_list", master_upload)
        uploaded_time = supaa._upsert("restaurant_opening_times", time_upload)
        print(f"Master upload:\n {uploaded_master}\n\n Time Upload:\n {uploaded_time}")




    # soups = add_all_tests_htmls()
    # for soup in soups:

    #     info_t = scraper.core_tabelog_information(soup)
    #     info_g = google_manager.find_restaurant_by_coords(info_t)
    #     combined = combine_two_dictionaries("Tabelog", "Google", info_t, info_g)
    #     add_to_records(combined)

def add_all_tests_htmls() -> list:
    #scraper -> tracker 
    soups = []
    i = 5
    while i < 8:
        soups.append(load_html(f"./tests/bar{i}"))
        i+=1
    ##### ABOVE LOADS THE HTML AS SOUP OBJECT#######
    return soups

        

if __name__ == '__main__': #Will only run when main is ran, not imported. 
    main()




