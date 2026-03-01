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
    def format_days(list_to_format:list):
        for section in list_to_format:
                section["days"] = [day[:3].capitalize() for day in section["days"]]
            
        return list_to_format

    def format_time(big: dict, google_id:str):
        google_id = google_id #(save this, can be given or found here)
        dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        opening_hours_dic = {}
        opening_hours = big.get("opening_hours")
        if not opening_hours or opening_hours == "N/A":
                return opening_hours_dic
        
        opening_hours = format_days(opening_hours) #formats so its Mon, Tue... 
        for days in dow: #Mon start    
            hours_formatted = [] #Empty List 
            for section in opening_hours:  
                if days in section["days"]:
                    hours_formatted.append(section["time_slot"]) #Add all hours for Monday 
            
            if hours_formatted:
                opening_hours_dic[days]  = list_to_string( separator=" and ",  my_list=hours_formatted)
            else:
                opening_hours_dic[days] = "N/A"
        time_index = supa_time_index(opening_hours_dic, google_id)
        #print(time_index)
        print(opening_hours_dic)
        timeeeee = time_supa_bs(opening_hours_dic)
        


    def supa_time_index(opening_hours, google_id):
        list_of_formatted_times = []
        for day_int, day in enumerate(opening_hours):
            time_period = opening_hours.get(day).lower()

            if time_period in ["closed", "n/a"]:
                continue   
    
            substring_list = time_period.split("and")

            for string in substring_list:
                if "n/a" not in string:
                    time_range = convert_supaa_time(string.strip())
                    list_of_formatted_times.append({"google_id" : google_id, "day_of_week" : day_int, "time_range" : time_range})
        return list_of_formatted_times
    
    def convert_supaa_time(time_string):
        time_string = time_string.replace(":", "")
        time_string_list = time_string.split(" - ")
        open_time = int(time_string_list[0])
        closed_time = int(time_string_list[1])
        if closed_time < open_time:
            closed_time = closed_time + 2400

        
        time_range = f"[{open_time}, {closed_time})"

        return time_range


    def time_supa_bs(opening_hours_dic):
        new_dict = {}
        closed_days = ""
        na_days = ""
        open_days = ""
        for day in opening_hours_dic:
            timeslot = opening_hours_dic[day]
            if timeslot in new_dict:   #if the time slot is in the dictionary
                new_dict[timeslot] += f", {day}"
            else:
                new_dict[timeslot] = day

          
        for time, days in new_dict.items():
            if time.lower() == "closed":
                closed_days += f"{days}\n{time}\n\n"
            elif time.lower() == "n/a":
                na_days += f"{days}\n{time}"
            else:
                open_days += f"{days}\n{time}\n\n"
        print(f"{open_days}{closed_days}{na_days}")
            
    #def time_table(opening_dic):

#     load_dotenv()
#     ai_key = os.getenv("GEMINI_API_KEY") 
#     google_key = os.getenv("GOOGLE_API_KEY")
#     supa_key = os.getenv("SUPABASE_API_KEY")
#     supa_url = os.getenv("SUPABASE_API_URL")
    
#     if not ai_key:
#         print("Error: Gemini API Key not found. Check your .env file.")
#         return
    
#     if not google_key:
#         print("Error: google API Key not found. Check your .env file.")
#         return
    
#     if not supa_key:
#         print("Error: Supa API Key not found. Check your .env file.")
#         return
    
#     if not supa_url:
#         print("Error: Supa URL not found. Check your .env file.")
#         return

#     ai_manager = gemini(ai_key)
#     google_manager = google_api(google_key)
#     supabase_client = create_client(supa_url, supa_key)
#     scraper = tabelog(ai_manager)
    

    


#     supaa = SupaMethods(supabase_client)
#     supa_format = SupaFormatter()
    
            

#     res = supaa._fetch_data("master_restaurant_list", ["google_id", "tabelog_hours_mon","tabelog_hours_tue","tabelog_hours_wed","tabelog_hours_thu","tabelog_hours_fri","tabelog_hours_sat","tabelog_hours_sun"])
#     data = res.data
#     info = supaa._upsert("restaurant_opening_times", supa_format.format_supabase_time(data))
#     print(info)


    
    
            
# def spare():
#     json_list = []
#     supa_form = SupaFormatter()
#     file_path = f"./data/url_map.json"
#     with open(file_path, 'r', encoding='utf-8') as f:
#         master = json.load(f)
#         for value in master.values():
#             json_list.append(load_restaurant_json(value))

 
    

#     #supa_list_upload = supa_form.format_multiple_lists(json_list, format_master_list )
#     #uploaded = supaa._upsert("master_restaurant_list", supa_list_upload)
#     #print(uploaded)

    
        
    file_path = f"./data/master_cache/ChIJI61yyDddGGARFIXWM0rf1qo.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        restaurant_info = json.load(f)
    format_time(restaurant_info["Tabelog"], "ChIJI61yyDddGGARFIXWM0rf1qo")
if __name__ == '__main__': #Will only run when main is ran, not imported. 
    main()




