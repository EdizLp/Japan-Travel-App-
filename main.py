from src.scraper import TabelogScraper as tabelog
from src.utils import check_master_records, add_to_records, combine_two_dictionaries, load_html, load_restaurant_json
from dotenv import load_dotenv 
import os 
from src.gemini_api import GeminiManager as gemini
from src.google_api import GooglePlacesManager as google_api
from src.supaformatter import Supa as sup_format
from supabase import create_client, Client

def main() -> None:


    load_dotenv()
    ai_key = os.getenv("GEMINI_API_KEY") 
    google_key = os.getenv("GOOGLE_API_KEY")
    supa_key = os.getenv("SUPABASE_API_KEY")
    supa_url = os.getenv("SUPABASE_API_URL")
    supabase: Client = create_client(supa_url, supa_key)
    if not ai_key:
        print("Error: API Key not found. Check your .env file.")
        return
    
    if not google_key:
        print("Error: API Key not found. Check your .env file.")
        return
    


    
    ai_manager = gemini(ai_key)
    google_manager = google_api(google_key)
    
    #adding_new_html(google_manager, ai_manager)
    #checking_supabase_upload()
    uploading_to_supa(supabase)
def adding_new_html(scraper, google_manager, ai_manager):

    scraper = tabelog(ai_manager)
    soup = load_html("./tests/bar7")   

    tabe_info = scraper.core_tabelog_information(soup)
    

    if tabe_info: 
        tabe_url = tabe_info.get("url") 
        restaurant_info = check_master_records(tabe_url)                                                                               
        if restaurant_info:                                                      
            print(restaurant_info) 
        else:
            google_info = google_manager.find_restaurant_by_coords(tabe_info)
            json_to_add = combine_two_dictionaries("Tabelog", "Google", tabe_info, google_info)
            add_to_records(json_to_add)
            print("Oingo boingo")
def checking_supabase_upload():
    pick = load_restaurant_json("ChIJjasnNnloA2AR3ulf_8kYXnE")
    super = sup_format()
    test = super.format_master_list(pick)
    print(test)

def uploading_to_supa(supabase):
    pick = load_restaurant_json("ChIJjasnNnloA2AR3ulf_8kYXnE")
    super = sup_format()
    test = super.format_master_list(pick)

    response = (
    supabase.table("Master Restaurant List")
    .upsert(test)
    .execute()
)
if __name__ == '__main__': #Will only run when main is ran, not imported. 
    main()




