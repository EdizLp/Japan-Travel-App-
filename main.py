from src.scraper import TabelogScraper as tabelog
from src.utils import check_master_records, add_to_records, combine_two_dictionaries, load_html, load_restaurant_json
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
    
            

    res = supaa._fetch_data("master_restaurant_list", ["google_id", "tabelog_hours_mon","tabelog_hours_tue","tabelog_hours_wed","tabelog_hours_thu","tabelog_hours_fri","tabelog_hours_sat","tabelog_hours_sun"])
    data = res.data
    info = supaa._upsert("restaurant_opening_times", supa_format.format_supabase_time(data))
    print(info)


    
    
            
def spare():
    json_list = []
    supa_form = SupaFormatter()
    file_path = f"./data/url_map.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        master = json.load(f)
        for value in master.values():
            json_list.append(load_restaurant_json(value))

 
    

    #supa_list_upload = supa_form.format_multiple_lists(json_list, format_master_list )
    #uploaded = supaa._upsert("master_restaurant_list", supa_list_upload)
    #print(uploaded)


if __name__ == '__main__': #Will only run when main is ran, not imported. 
    main()




