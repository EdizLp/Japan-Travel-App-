from .utils import load_schema




class Supa():
    def __init__(self):
        
        
        
        
        
        
    def format_master_list(self, full_data: dict) -> dict:   #think about KeyError if it doesn't exist
        
            
        "google_id" = full_data["Google"]["id"],
        "japanese_name" = full_data["Tabelog"]["name"],
        "tabelog_rating"  = full_data["Tabelog"]["rating"],
        "tabelog_address"  = full_data["Tabelog"]["address"],
        "tabelog_url"  = full_data["Tabelog"]["url"],
        "reservation_info" = full_data["Tabelog"]["reservation_info"],
        "reservation_availability" = full_data["Tabelog"]["reservation_availability"],
        "operational_info" = full_data["Tabelog"]["operational_info"],
        "tabelog_hours_mon" = 
        "tabelog_hours_tue"
        "tabelog_hours_wed"
        "tabelog_hours_thu"
        "tabelog_hours_fri"
        "tabelog_hours_sat"
        "tabelog_hours_sun"
        "type" = 
        "genre" = full_data["Google"]["primaryType"], #Clean this so it doesnt have the underscore 
        "phone_number" = full_data["Google"]["internationalPhoneNumber"], #this might not exist
        "city" = , #loop through the list
        "prefecture" = ,#loop through the list in addressComponents
        "google_rating" = full_data["Google"]["rating"],
        "google_url" = full_data["Google"]["googleMapsUri"],
        "google_hours_mon" = 
        "google_hours_tue" = ,
        "google_hours_wed" = ,
        "google_hours_thu" = ,
        "google_hours_fri" = ,
        "google_hours_sat" = ,
        "google_hours_sun" = ,
        "price_level" = full_data["Google"]["priceLevel"],
        "website" =  full_data["Google"]["websiteUri"],
        "google_coords" = (full_data["Google"]["location"]["latitude"], full_data["websiteUri"]["location"]["longitude"]) #tuple
        "tabelog_coords" = (full_data["Tabelog"]["coords"][0], full_data["Tabelog"]["coords"][1])
        "google_viewport" = (full_data["Google"]["viewport"]["latitude"], full_data["websiteUri"]["location"]["longitude"]) #tuple


        }

    