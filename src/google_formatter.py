def process_google_data(data_source:dict, names_and_keys:list) -> dict: # Each one should return the data to export or None.
    google_extract = {}
    for pairs in names_and_keys:
        data = 
        google_extract[]
    google_extract[]



def extract_simple_data(data_source) -> bool | None:
    """Extracts the exact value given with no need to format the data"""
    data_to_export = data_source.get(field_tuple[1])
    if data_to_export != "N/A" and data_to_export != None:
        data_to_export[field_tuple[0]] = data_to_export
        return True
        
    return False

def _extract_google_price( data_source: dict) -> bool:
        """This extracts the price level changing it from the format:
        PRICE_LEVEL_MODERATE
        to:
        Moderate"""

        price_level = data_source.get("priceLevel")
        if price_level:
            data_to_export["price_level"] = (price_level.replace("PRICE_LEVEL_", "").capitalize()).replace("_", " ")
            return True

        return False
def _extract_google_coords(data_source: dict) -> bool:
        """This extracts the coordinates given by google"""
        location = data_source.get("location")
        if location:
            data_to_export["google_coords"] = [location["latitude"], location["longitude"]]
            return True
    
        return False
def _english_name_extract(data_source: dict) -> bool:
    """This extracts the display name given by google, in the rare cases it's not in English that is added on """
    display_name = data_source.get("displayName")
    if display_name:
        if display_name.get("languageCode") != "en":
            data_to_export["google_name"] = f"{display_name.get('text')}\nNo English Name" 
        else:
            data_to_export["google_name"] = display_name.get("text")
        return True
    return False

def _extract_genre(data_source: dict) -> bool:
    """This extracts the primaryType field from our google data, formatting it nicely"""
    primary_type =  data_source.get("primaryType")
    
    if primary_type:
        data_to_export["genre"] = string.capwords(data_source["primaryType"].replace("_", " "))
        return True
    return False

def _extract_type(data_source: dict) -> bool:

    type_of_place = data_source.get("types")
    if type_of_place:
        if "food" in type_of_place:
            data_to_export["type"] = "Restaurant"
            return True
        if "bar" in type_of_place:
            data_to_export["type"] = "Bar"
            return True
    return False

def _extract_city_prefecture(data_source: dict) -> bool:

    address_components = data_source.get("addressComponents")
    if address_components:
        for components in address_components:
            try:
                if "locality" in components["types"]:
                    data_to_export["city"] = components["longText"]
            except KeyError:
                continue
            try:
                if "administrative_area_level_1" in components["types"]:
                    data_to_export["prefecture"] = components["longText"]
            except KeyError:
                continue
        return True
    return False

def _convert_google_hours(data_source: dict) -> None:

    opening_hours = data_source.get("regularOpeningHours", {}) #default value {} 
    time_array = opening_hours.get("weekdayDescriptions")
    if not time_array:
        return
    for day_string in time_array:
        # day_string looks like "Monday: 9:00 AM – 5:00 PM"
        day_prefix = day_string[:3].capitalize()

        for day in data_to_export.days:
            if day_prefix == day:
                # Split at the first ": " and take everything after it
                data_to_export[f"google_hours_{day.lower()}"] = day_string.split(": ", 1)[1]
                break