from bs4 import BeautifulSoup, Tag
from .utils import extract_substring_between, load_schema #use . as we run this from main, the . tells python look in the same folder as this module 


class TabelogScraper:
    def __init__(self, ai_manager):
        self.schema = load_schema("tabelog")
        self.ai = ai_manager
    
    def _safe_get_attribute(self, tag: Tag | None, attribute: str) -> str:
        """Safely gets an attribute (like 'href' or 'src') from a Tag."""
        try:
            attribute_string =  tag[attribute]
        except (ValueError, AttributeError):
            attribute_string = "N/A"
        return attribute_string

    def _safe_get_text(self, tag: Tag | None, separator: str = "", strip: bool = True) -> str:
        """Gets text between tags, strips it, and returns 'N/A' if tag is missing."""
        try:
            tag_text = tag.get_text(separator, strip=strip)
            
        except AttributeError:
            tag_text = "N/A"
        return tag_text


    def find_restaurant_name(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurant name as a string, it will return "N/A" if the name could not be found"""

        restaurant_name_header = soup.find("h2", class_= "display-name") #Grabbing where the information is stored, if they change the html this needs to all change
        restaurant_name = self._safe_get_text(restaurant_name_header) 
        
        return restaurant_name


    def find_restaurant_address(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurant address as a str, it will return "N/A" if it could not be found"""

        restaurant_address_container = soup.find("p", class_= "rstinfo-table__address") 
        address_of_restaurant = self._safe_get_text(restaurant_address_container)
        
        return address_of_restaurant


    def find_opening_hours(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurants opening hours from tabelog in Japanese as a String, it will return "N/A" if it could not be found """
        try:
            opening_hours_td = soup.find("th", string="営業時間").find_next("td")  #Finds the table after the heading 営業時間 and takes all the information
        except AttributeError:
            opening_hours_td = None
        opening_hours = self._safe_get_text(opening_hours_td, "\n")
        
        return opening_hours
    

    def find_reservation_info (self, soup: BeautifulSoup) -> str:
        """This method returns the restaurants reservation information from tabelog in Japanese as a String, it will return "N/A" if it could not be found """
        
        reservation_status_td = soup.find("th", string="予約可否").find_next("td")
        reservation_info = self._safe_get_text(reservation_status_td)
    

        return reservation_info

    
    def find_restaurant_rating(self, soup: BeautifulSoup) ->  float | str:
        """This method returns the restaurant rating as a float, it will return "N/A" if the rating could not be found"""

        restaurant_rating_score = soup.find("span", class_= "rdheader-rating__score-val-dtl") #if soup cannot find the rating then it will return none
        try:
            rating_of_restaurant = float(self._safe_get_text(restaurant_rating_score))
        except ValueError:
            rating_of_restaurant = "N/A"
           
        
        return rating_of_restaurant

    


    


    def find_restaurant_coords(self, soup: BeautifulSoup) -> tuple | str:
        """This method returns the restaurant address as a tuple containing two floats, it will return "N/A" if it could not be found"""

        restaurant_coord_container = soup.find("img", class_="rstinfo-table__map-image")
        restaurant_coords = self._safe_get_attribute(restaurant_coord_container, "data-lazy-src")

        if restaurant_coords == "N/A":
            return "N/A"
        

        try:
            restaurant_coords = extract_substring_between("center=", "&style", restaurant_coords)
            restaurant_coords = restaurant_coords.split(",") #Doing this to separate longitude and latitude to turn it into a tuple.
            latitude = float(restaurant_coords[0])
            longitude = float(restaurant_coords[1])
            restaurant_coords_tup = (latitude, longitude)
        
        except (ValueError, IndexError, AttributeError):
            return "N/A"


        return restaurant_coords_tup
    


    def find_tabelog_url(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurants tabelog webaddress as a str, it will return "N/A" if it could not be found"""

        canonical_tag = soup.find("link", rel="alternate", hreflang = "ja")             #Find the link for the Japanese site (This will work for any language.)
        tabelog_url = self._safe_get_attribute(canonical_tag, "href")
        
        return tabelog_url
    
    

    def scrape_raw_data(self, soup: BeautifulSoup) -> dict:
        """This takes a BeautifulSoup object as it's argument (Tabelog website) and returns the raw data in the form of a dictionary with the keys:
        name
        rating
        address
        coords
        url
        reservation_info
        opening_hours
        
        Any values that were unable to be found will return "N/A". 
              
        """

        raw_information = {
            "name":self.find_restaurant_name(soup),
            "rating":self.find_restaurant_rating(soup),
            "address":self.find_restaurant_address(soup),
            "coords":self.find_restaurant_coords(soup),
            "url":self.find_tabelog_url(soup),
            "reservation_info":self.find_reservation_info(soup),
            "opening_hours":self.find_opening_hours(soup)
        }

        return raw_information
    
    def core_tabelog_information(self, soup: BeautifulSoup) -> dict:
        """This method collects the core information from tabelog and returns it in the form of a dictionary with keys:
        name
        rating
        address
        coords
        url
        reservation
        reservation_info
        opening_hours
        """
        
        
        core_information = self.scrape_raw_data(soup)

        info_to_translate = {
                            "reservation":core_information["reservation_info"],
                            "opening_hours":core_information["opening_hours"]
                            }   
            
        
        translated_info = self.translate_information(info_to_translate)
        core_information["reservation_availability"] = translated_info["reservations_availability"]
        core_information["reservation_info"] = translated_info["reservation_info"]
        core_information["opening_hours"] = translated_info["opening_hours"]
        core_information["operational_info"] = translated_info["operational_info"]
        
        return core_information 

    def translate_information(self, info: dict) -> dict:
        """ This method takes information in Japanese and translates it to English.
        It will call upon the prompt_gemini method, give it a prompt, schema and config. and 
        It will return the translation as a dictionary """


        #This prompt is for gemini
        prompt = f"""
        TASK: Extract and translate restaurant data to english.
        SOURCE TEXT:\n

        Reservation Information: {info["reservation"]}\n
        Opening Hours: {info["opening_hours"]}

        INSTRUCTIONS:
        - Use "N/A" for missing fields.
        - Use 24-hour time format exclusively.
        """

        config = {"response_mime_type": "application/json"}      #Config for our gemini request
        
        tabelog_translation = self.ai.process_json(prompt, config, self.schema)    
        return tabelog_translation


    
    
    






