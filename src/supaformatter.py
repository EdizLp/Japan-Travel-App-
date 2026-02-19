import string



class Supa():
    def __init__(self):
        self.export = {} #Clear this after each use?
        self.days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        self.simple_exports = [
                            ("Google", [
                                ("google_id", "id"), ("phone_number", "internationalPhoneNumber"), ("google_rating", "rating"), ("google_viewport","viewport"),
                                ("google_url", "googleMapsUri"), ("website","websiteUri"), ("google_address", "formattedAddress")
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



    def _format_tabe_days(self, list_to_format: list) -> dict:
        """
        This takes an 
        """

        
        for section in list_to_format:
            section["days"] = [day[:3].lower() for day in section["days"]]
        
        return list_to_format
        
    def _extract_tabe_hours(self, data_source: dict) -> None:

        opening_hours = data_source.get("opening_hours")
        if not opening_hours or opening_hours == "N/A":
            return

        formatted_days = self._format_tabe_days(opening_hours)
        
        
        for day in self.days:
            hours_formatted = ""
            for section in formatted_days:
                if day in section["days"]:
                    hours_formatted += f"{section["time_slot"]}\n"
        
            if hours_formatted:
                self.export[f"tabelog_hours_{day}"] = [hours_formatted.rstrip()]


    def _extract_tabe_coords(self, data_source: dict) -> bool:
        if data_source["coords"] == "N/A":
            return False
        else:
            self.export["tabelog_coords"] = [data_source["coords"][0], data_source["coords"][1]] 
            return True
        
    

    def _extract_google_price(self, data_source: dict) -> bool:

        price_level = data_source.get("priceLevel")
        if price_level:
            self.export["price_level"] = price_level.replace("PRICE_LEVEL_", "").capitalize()
            return True

        return False
        
    def _extract_google_coords(self, data_source: dict) -> bool:
        
        location = data_source.get("location")
        if location:
            self.export["google_coords"] = [location["latitude"], location["longitude"]]
            return True
    
        return False

    def _english_name_extract(self, data_source: dict) -> bool:
        
        display_name = data_source.get("displayName")
        if display_name:
            if display_name.get("languageCode") != "en":
                self.export["google_name"] = f"{display_name.get('text')}\nNo English Name" 
            else:
                self.export["google_name"] = display_name.get("text")
            return True
        return False
             

    def _extract_genre(self, data_source: dict) -> bool:

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
                if "locality" in components["types"]:
                    self.export["city"] = components["longText"]
                if "administrative_area_level_1" in components["types"]:
                    self.export["prefecture"] = components["longText"]
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

        



    def format_master_list(self, full_data: dict) -> dict:   #think about KeyError if it doesn't exist
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

        

        

    
        
        


        

    