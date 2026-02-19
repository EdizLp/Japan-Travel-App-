import requests #To send a POST request to google





class GooglePlacesManager:

    def __init__ (self, api_key: str | None = None):
        self.api_key = api_key 
        self.places_url = "https://places.googleapis.com/v1/places:searchText"  #URL For searchText API 

        self.restaurant_headers = { #Dictionary with headers for the HTML Post request for restaurants 
            "Content-Type": "application/json",   #Content Type indicates what format my information is in       
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.currentOpeningHours,places.websiteUri,places.internationalPhoneNumber,places.businessStatus,places.priceLevel,places.types,places.primaryType,places.googleMapsUri,places.photos,places.addressComponents,places.adrFormatAddress,places.viewport,places.utcOffsetMinutes"
        }   #Field mask is the data we want
        
        
    def check_multiple_places(self, response : dict) -> dict:
        """Checks if google found multiple restaurants
            If it did, then we only take the first restaurants information
        """
        
        if "places" in response and len(response["places"]) > 0:    
            response = response["places"][0]  
        return response
    
    def find_restaurant_by_coords(self, info = dict) -> dict: 
        """
        Given a dictionary that contains the coords and name of a restaurant
        This will find the google information via the google places api. 
        """
        
        name = info.get("name")
        coords = info.get("coords")
        if name == "N/A" or coords =="N/A" or not name or not coords:
            return None



        place_info = { #Informaton of the place, we don't have the place ID yet
        "textQuery": name, 
        "locationBias": { #Location Bias is the area we are looking for 
            "circle": { 
                "center": {"latitude": coords[0], "longitude": coords[1]}, #Coords of place 
                "radius": 50.0 #Radius in Metres 
                }   
            },
        "languageCode": "en" 
        }



        response = requests.post(
        self.places_url,#Using the searchText part of the API 
        headers=self.restaurant_headers,
        json=place_info
        )

        google_response = response.json()
        

        
        google_info = self.check_multiple_places(google_response)
        

        return google_info








