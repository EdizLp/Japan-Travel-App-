import requests #To send a POST request to google
import os#for hiding api
from dotenv import load_dotenv # for hiding api key 

load_dotenv()

def request_information(info = dict): 
    api_key = os.getenv("GOOGLE_API_KEY") #Grab key from .env so its not public

    headers = { #Dictionary with headers for the HTML Post request
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.currentOpeningHours,places.websiteUri,places.internationalPhoneNumber,places.businessStatus,places.priceLevel,places.types,places.primaryType,places.googleMapsUri,places.photos,places.addressComponents,places.adrFormatAddress,places.viewport,places.utcOffsetMinutes"
    } 
    #Field mask is the data we want
    #API Key is self-explanatory

    place_info = { #Informaton of the place, we don't have the place ID yet
    "textQuery": info.get("Name"), 
    "locationBias": { #Location Bias is the area we are looking for 
        "circle": { 
            "center": {"latitude": info.get("Coords")[0], "longitude": info.get("Coords")[1]}, #Coords of place 
            "radius": 50.0 #Radius in Metres 
            }   
        },
    "languageCode": "ja" # Japanese 
    }

    response = requests.post(
    "https://places.googleapis.com/v1/places:searchText",#Using the searchText part of the API 
    headers=headers,
    json=place_info
    )

    response_json = response.json()
    
    if "places" in response_json and len(response_json["places"]) > 0:
        # Return only the first restaurant dictionary
        response_json = response_json["places"][0]#We are only pulling one result at a time sooo
    return response_json








