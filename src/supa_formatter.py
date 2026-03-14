import string
from .utils import list_to_string
from collections import namedtuple

class SupaFormatter:
    """This class handles formatting things to upload to my supabase"""
    def __init__(self):
        self.export = {} #basic export for main table
        self.time_export = []  #export for 24hr time table for filtering (is it open)
        self.unimportantexport = {} #for unimportant data that won't be used much but we want to capture 
        self.days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        self.google_exports = [
                                ("google_id", "id"), ("phone_number", "internationalPhoneNumber"), ("google_rating", "rating"), ("google_viewport","viewport"),
                                ("google_url", "googleMapsUri"), ("website","websiteUri"), ("google_address", "formattedAddress"), ("amount_google_ratings", "userRatingCount")
                                        ]
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
        #in the format column_name, dict name.
 
    

    def _extract_simple_data(self, data_source: dict,  field_tuple: tuple ) -> bool : 
        """Extracts the exact value given with no need to format the data"""
        data_to_export = data_source.get(field_tuple[1])
        if data_to_export != "N/A" and data_to_export != None:
            self.export[field_tuple[0]] = data_to_export
            return True
        
        return False



    def _format_tabe_days(self, list_to_format: list) -> list:
        """This ensures our tabelog days keys are capitalised and 3 characters. I.e. Mon, Tue, Wed 
        This loops through a list of dictionaries containing strings for values and days as the key. 
        For each dictionary it changes the values to be only the first 3 characters capitalised 
        It returns the formatted list of dictionaries.
        """

        for section in list_to_format:
            section["days"] = [day[:3].capitalize() for day in section["days"]]
        
        return list_to_format
        
    def extract_tabe_hours(self, data_source: dict) -> dict:
        """This returns the dictionary containing the opening hours in the form 
        {"Mon":Operational Hours,
         "Tue":Operational Hours,
          ...
         "Sun":Operational Hours " }
        """
        opening_hours_dic = {}
        opening_hours = data_source.get("opening_hours")
        if not opening_hours or opening_hours == "N/A":
                return opening_hours_dic
        
        opening_hours = self._format_tabe_days(opening_hours) 
        for days in self.days:  
            hours_formatted = [] 
            for section in opening_hours:  
                if days in section["days"]:
                    hours_formatted.append(section["time_slot"])  
            
            if hours_formatted:
                opening_hours_dic[days]  = list_to_string( separator=" and ",  my_list=hours_formatted)
            else:
                opening_hours_dic[days] = "N/A"
        self.export["opening_hours"] = self.opening_hours_pretty(opening_hours_dic)
        return opening_hours_dic
    
    def opening_hours_pretty(self, opening_hours_dic):
        """Returns opening hours for the DB as a string"""
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
        
        return (f"{open_days}{closed_days}{na_days}")
    
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
            self.export["price_level"] = (price_level.replace("PRICE_LEVEL_", "").capitalize()).replace("_", " ")
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
            day_prefix = day_string[:3].capitalize()

            for day in self.days:
                if day_prefix == day:
                    # Split at the first ": " and take everything after it
                    self.export[f"google_hours_{day.lower()}"] = day_string.split(": ", 1)[1]
                    break

        



    def convert_to_supa(self, full_data: dict) -> dict:   
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
            opening_hours = self.extract_tabe_hours(tabe_data) 
            self.prep_db_time_filter(google_data["id"], opening_hours)

        return


    def prep_supa_data(self, list_of_website_data: list) -> list:
        """Given a list of formatted json data (From Tabelog and Google)
        return two sets of data ready to upload, one for the main table
        one for the time index table
        """
        master_list_data = []
        self.time_export = []
        
        for data in list_of_website_data:
            self.convert_to_supa(data)
            master_list_data.append(self.export)
        return master_list_data, self.time_export



    def prep_db_time_filter(self, google_id:str, opening_hours:dict) -> list:
        """This method takes a google_id and dictionary in the format {Day:Opening hours} and preps it for the time filtering table for db
        Data is ready to upload once it has been returned from here 
        """
        
        for day_int, day in enumerate(opening_hours):
            time_period = opening_hours.get(day).lower()

            if time_period in ["closed", "n/a"]:
                continue   
                
            substring_list = time_period.split("and")

            for string in substring_list:
                if "n/a" not in string:
                    time_range = self.time_period_past_24hr(string.strip())
                    self.time_export.append({"google_id" : google_id, "day_of_week" : day_int, "time_range" : time_range})

                   

    def time_period_past_24hr(self, time_string:str) -> str:
        """This converts times periods like 13:00 - 01:00 to [1300 - 2500) 
            Takes a string as the input to convert, returns a str
        """
        time_string = time_string.replace(":", "")
        time_string_list = time_string.split(" - ")
        open_time = int(time_string_list[0])
        closed_time = int(time_string_list[1])
        if closed_time < open_time:
            closed_time = closed_time + 2400

        
        time_range = f"[{open_time}, {closed_time})"

        return time_range
    


        

    
        
        


        

    