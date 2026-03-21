from collections import namedtuple


def process_google_data(data_source:dict) -> dict: 
    if data_source.get("businessStatus") != "CLOSED_PERMANENTLY":
        GoogleFieldMap = namedtuple("FieldMap", ["db_col_name", "json_key", "format_function"])

        #GoogleFieldMap(db_col="google_id", json_key="photos", format_function=extract_simple_data) photos 

        GOOGLE_MAPPING_MASTER = [
        GoogleFieldMap(db_col="google_id", json_key="id", format_function=extract_simple_data), #google id - Nothing needs to change
        GoogleFieldMap(db_col="phone_number", json_key="internationalPhoneNumber", format_function=extract_simple_data),#international phone number - Nothing needs to change
        GoogleFieldMap(db_col="google_rating", json_key="rating", format_function=extract_simple_data),#google rating - Nothing needs to change
        GoogleFieldMap(db_col="google_viewport", json_key="viewport", format_function=extract_simple_data),#viewport - Nothing needs to change
        GoogleFieldMap(db_col="google_url", json_key="googleMapsUri", format_function=extract_simple_data),#google maps url - Nothing needs to change
        GoogleFieldMap(db_col="website", json_key="websiteUri", format_function=extract_simple_data),#website url - Nothing needs to change
        GoogleFieldMap(db_col="google_address", json_key="formattedAddress", format_function=extract_simple_data),#formatted address - Nothing needs to change
        GoogleFieldMap(db_col="amount_google_ratings", json_key="userRatingCount", format_function=extract_simple_data),#user rating count  - Nothing needs to change
        GoogleFieldMap(db_col="delivery_availability", json_key="delivery", format_function=extract_simple_data),#delivery - added
        GoogleFieldMap(db_col="sports_watching", json_key="goodForWatchingSports", format_function=extract_simple_data),#sports
        GoogleFieldMap(db_col="live_music", json_key="liveMusic", format_function=extract_simple_data),#live music?
        GoogleFieldMap(db_col="outdoor_seating", json_key="outdoorSeating", format_function=extract_simple_data),#outdoor seating?
        GoogleFieldMap(db_col="google_reservation", json_key="reservable", format_function=extract_simple_data),#reservable?
        GoogleFieldMap(db_col="serves_breakfast", json_key="servesBreakfast", format_function=extract_simple_data),#breakfast
        GoogleFieldMap(db_col="serves_cocktails", json_key="servesCocktails", format_function=extract_simple_data),#cocktails 
        GoogleFieldMap(db_col="serves_dinner", json_key="servesDinner", format_function=extract_simple_data),#dinner
        GoogleFieldMap(db_col="serves_lunch", json_key="servesLunch", format_function=extract_simple_data),#lunch
        GoogleFieldMap(db_col="serves_vegetarian", json_key="servesVegetarianFood", format_function=extract_simple_data),#vegetarian? 
        GoogleFieldMap(db_col="takeout_availability", json_key="takeout", format_function=extract_simple_data),#takeout
        #Not simple
        GoogleFieldMap(db_col="price_level", json_key="priceLevel", format_function=extract_simple_data),#price
        GoogleFieldMap(db_col="google_coords", json_key="location", format_function=extract_simple_data),#coords
        GoogleFieldMap(db_col="google_name", json_key="displayName", format_function=extract_simple_data),#english name
        GoogleFieldMap(db_col="genre", json_key="primaryType", format_function=extract_simple_data),#Genre
        GoogleFieldMap(db_col="type", json_key="types", format_function=extract_simple_data),#type
        GoogleFieldMap(db_col="prefecture", json_key="addressComponents", format_function=extract_simple_data),#prefecture
        GoogleFieldMap(db_col="city", json_key="addressComponents", format_function=extract_simple_data),#city
        GoogleFieldMap(db_col="google_hours_mon", json_key="regularOpeningHours", format_function=extract_simple_data),#google hours mon
        GoogleFieldMap(db_col="google_hours_tue", json_key="regularOpeningHours", format_function=extract_simple_data),#google hours tue
        GoogleFieldMap(db_col="google_hours_wed", json_key="regularOpeningHours", format_function=extract_simple_data),#google hours wed
        GoogleFieldMap(db_col="google_hours_thu", json_key="regularOpeningHours", format_function=extract_simple_data),#google hours thu
        GoogleFieldMap(db_col="google_hours_fri", json_key="regularOpeningHours", format_function=extract_simple_data),#google hours fri
        GoogleFieldMap(db_col="google_hours_sat", json_key="regularOpeningHours", format_function=extract_simple_data),#google hours sat
        GoogleFieldMap(db_col="google_hours_sun", json_key="regularOpeningHours", format_function=extract_simple_data),#google hours sun
        #Not simple and new 
        GoogleFieldMap(db_col="review_summary", json_key="reviewSummary", format_function=extract_simple_data),#review summary
        GoogleFieldMap(db_col="generative_summary", json_key="generativeSummary", format_function=extract_simple_data),#generative summary
        GoogleFieldMap(db_col="accepts_card", json_key="paymentOptions", format_function=extract_simple_data),#payment options
        GoogleFieldMap(db_col="cash_only", json_key="paymentOptions", format_function=extract_simple_data),#payment options
        GoogleFieldMap(db_col="start_price", json_key="priceRange", format_function=extract_simple_data),#start price (as a string to include currency)
        GoogleFieldMap(db_col="end_price", json_key="priceRange", format_function=extract_simple_data),#end price
        
        ]

        google_extract = {}
        for db_col, json_key, format_function in GoogleFieldMap:
            raw_value = raw_google_json.get(json_key)
        
            if raw_value is not None:
                # We just use whatever variable name we picked in the loop above
                formatted_restaurant_data[db_col] = function(raw_value)

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