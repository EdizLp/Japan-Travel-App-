import string
from .utils import list_to_string


class SupaFormatter:
    """This class handles formatting things to upload to my supabase"""
    def __init__(self):
        self.export = {}  
        self.days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        self.simple_exports = [
                            ("Google", [
                                ("google_id", "id"), ("phone_number", "internationalPhoneNumber"), ("google_rating", "rating"), ("google_viewport","viewport"),
                                ("google_url", "googleMapsUri"), ("website","websiteUri"), ("google_address", "formattedAddress"), ("amount_google_ratings", "userRatingCount")
                                        ]),
                            
                            ("Tabelog", [
                                ("japanese_name", "name"), ("tabelog_rating","rating" ), ("tabelog_address", "address"), ("tabelog_url", "url"), 
                                ("reservation_info", "reservation_info"), ("reservation_availability","reservation_availability" ), ("operational_info", "operational_info")
                                        ])
                            ]
 
    

    def _extract_simple_data(self, data_source: dict,  field_tuple: tuple ) -> bool : 
        """Extracts the exact value given with no need to format the data"""
        data_to_export = data_source.get(field_tuple[1])
        if data_to_export != "N/A" and data_to_export != None:
            self.export[field_tuple[0]] = data_to_export
            return True
        
        return False



    def _format_tabe_days(self, list_to_format: list) -> list:
        """
        This loops through a list of dictionaries containing strings for values and days as the key. 
        For each dictionary it changes the values to be only the first 3 characters in lowercase
        It returns the formatted list of dictionaries.
        """

        
        for section in list_to_format:
            section["days"] = [day[:3].lower() for day in section["days"]]
        
        return list_to_format
        
    def _extract_tabe_hours(self, data_source: dict) -> None:
        """If we have the tabelog hours, this function will grab the hours for each day and output add them to self.export as KVP in the format
        day:opening hours
        tabelog_hours_DAYOFWEEK : XX:XX - YY:YY ||
        For example:
        11:00 - 14:00 ||16:30 - 19:00 ||
        """
        opening_hours = data_source.get("opening_hours")
        if not opening_hours or opening_hours == "N/A":
            return

        formatted_days = self._format_tabe_days(opening_hours)
        
        for day in self.days:
            hours_formatted = []
            for section in formatted_days:
                if day in section["days"]:
                    hours_formatted.append(section["time_slot"])
        
            if hours_formatted:
                
                self.export[f"tabelog_hours_{day}"] = list_to_string( separator=" and ",  my_list=hours_formatted)

        

    def _extract_tabe_coords(self, data_source: dict) -> bool:
        """This extracts the coordinates scraped from tabelog and formats them as a list"""
        if data_source["coords"] == "N/A":
            return False
        else:
            self.export["tabelog_coords"] = [data_source["coords"][0], data_source["coords"][1]] 
            return True
        
    

    def _extract_google_price(self, data_source: dict) -> bool:
        """This extracts the price level changing it from the format:
        PRICE_LEVEL_MODERATE
        to:
        Moderate"""

        price_level = data_source.get("priceLevel")
        if price_level:
            self.export["price_level"] = price_level.replace("PRICE_LEVEL_", "").capitalize()
            return True

        return False
        
    def _extract_google_coords(self, data_source: dict) -> bool:
        """This extracts the coordinates given by google"""
        location = data_source.get("location")
        if location:
            self.export["google_coords"] = [location["latitude"], location["longitude"]]
            return True
    
        return False

    def _english_name_extract(self, data_source: dict) -> bool:
        """This extracts the display name given by google, in the rare cases it's not in English that is added on """
        display_name = data_source.get("displayName")
        if display_name:
            if display_name.get("languageCode") != "en":
                self.export["google_name"] = f"{display_name.get('text')}\nNo English Name" 
            else:
                self.export["google_name"] = display_name.get("text")
            return True
        return False
             

    def _extract_genre(self, data_source: dict) -> bool:
        """This extracts the primaryType field from our google data, formatting it nicely"""
        primary_type =  data_source.get("primaryType")
        
        if primary_type:
            self.export["genre"] = string.capwords(data_source["primaryType"].replace("_", " "))
            return True
        return False

    def _extract_type(self, data_source: dict) -> bool:

        type_of_place = data_source.get("types")
        if type_of_place:
            if "food" in type_of_place:
                self.export["type"] = "Restaurant"
                return True
            if "bar" in type_of_place:
                self.export["type"] = "Bar"
                return True
        return False

    def _extract_city_prefecture(self, data_source: dict) -> bool:

        address_components = data_source.get("addressComponents")
        if address_components:
            for components in address_components:
                try:
                    if "locality" in components["types"]:
                        self.export["city"] = components["longText"]
                except KeyError:
                    continue
                try:
                    if "administrative_area_level_1" in components["types"]:
                        self.export["prefecture"] = components["longText"]
                except KeyError:
                    continue
            return True
        return False


    def _convert_google_hours(self, data_source: dict) -> None:

        opening_hours = data_source.get("regularOpeningHours", {}) #default value {} 
        time_array = opening_hours.get("weekdayDescriptions")
        if not time_array:
            return
        for day_string in time_array:
            # day_string looks like "Monday: 9:00 AM – 5:00 PM"
            day_prefix = day_string[:3].lower()

            for day in self.days:
                if day_prefix == day:
                    # Split at the first ": " and take everything after it
                    self.export[f"google_hours_{day}"] = day_string.split(": ", 1)[1]
                    break

        



    def format_master_list(self, full_data: dict) -> dict:   
        """Formats data pulled from google and tabelog to send to supabase""" 
        self.export = {}

        for source_name, field_list in self.simple_exports:
            source_data = full_data.get(source_name) #Just checks Tabelog and Google are in our data

            if not source_data or source_data == "N/A":
                continue

            for field_tuple in field_list:
                self._extract_simple_data(source_data, field_tuple)
        
        google_data = full_data.get("Google")
        tabe_data = full_data.get("Tabelog")

        if google_data:
            self._extract_google_price(google_data)
            self._extract_google_coords(google_data)
            self._english_name_extract(google_data)
            self._extract_genre(google_data)
            self._extract_type(google_data)
            self._extract_city_prefecture(google_data) 
            self._convert_google_hours(google_data) 
        if tabe_data:
            self._extract_tabe_coords(tabe_data)
            self._extract_tabe_hours(tabe_data) 
    
        return self.export


    def format_multiple_lists(self, list_of_data: list) -> list:
        list_of_formatted_data = []
        
        for data in list_of_data:
            print(f"We are on {data['Google']['id']}")
            list_of_formatted_data.append(self.format_master_list(data))
        return list_of_formatted_data

    def testing(self, full_data):
        """You can choose what specific data u want to test, I believe supabase has a way to check as well but this is almost a pre_check."""
        google_data = full_data.get("Google")
        tabe_data = full_data.get("Tabelog")
        self._extract_tabe_hours(tabe_data) 

        print(self.export)

        

    
        
        


        

    