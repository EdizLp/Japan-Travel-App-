from src.scraper import TabelogScraper as tabelog
from src.utils import check_master_records, add_to_records, combine_two_dictionaries, load_html
from dotenv import load_dotenv 
import os 
from src.gemini_api import GeminiManager as gemini
from src.google_api import GooglePlacesManager as google_api


def main() -> None:


    load_dotenv()
    ai_key = os.getenv("GEMINI_API_KEY") 
    google_key = os.getenv("GOOGLE_API_KEY")
    if not ai_key:
        print("Error: API Key not found. Check your .env file.")
        return
    
    if not google_key:
        print("Error: API Key not found. Check your .env file.")
        return
    


    
    ai_manager = gemini(ai_key)
    google_manager = google_api(google_key)
    scraper = tabelog(ai_manager)
    



    soup = load_html("./tests/test6")   

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


if __name__ == '__main__': #Will only run when main is ran, not imported. 
    main()





