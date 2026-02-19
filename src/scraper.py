from bs4 import BeautifulSoup
from .utils import extract_substring_between, load_schema #use . as we run this from main, the . tells python look in the same folder as this module 


class TabelogScraper:
    def __init__(self, ai_manager):
        self.schema = load_schema("tabelog")
        self.ai = ai_manager
    

    def find_restaurant_name(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurant name as a string, it will return "N/A" if the name could not be found"""

        restaurant_name_header = soup.find("h2", class_= "display-name") #Grabbing where the information is stored, if they change the html this needs to all change
        try: #if soup cannot find the name then it will return none
            restaurant_name = restaurant_name_header.get_text().strip()
        except AttributeError:
            restaurant_name = "N/A"
        
        return restaurant_name
    


    def find_restaurant_rating(self, soup: BeautifulSoup) ->  float | str:
        """This method returns the restaurant rating as a float, it will return "N/A" if the rating could not be found"""

        restaurant_rating_score = soup.find("span", class_= "rdheader-rating__score-val-dtl") #if soup cannot find the rating then it will return none
        try: 
            rating_of_restaurant = float(restaurant_rating_score.get_text().strip())
        except (AttributeError, ValueError):
            rating_of_restaurant = "N/A"
        
        return rating_of_restaurant
    

    def find_restaurant_address(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurant address as a str, it will return "N/A" if it could not be found"""

        restaurant_address_container = soup.find("p", class_= "rstinfo-table__address") 
        try: #Checks if it can find the address
            address_of_restaurant = restaurant_address_container.get_text().strip()#Get returns everything outside of the tags etc
        except AttributeError:
            address_of_restaurant ="N/A"
        
        return address_of_restaurant

    def find_restaurant_coords(self, soup: BeautifulSoup) -> tuple | str:
        """This method returns the restaurant address as a tuple containing two floats, it will return "N/A" if it could not be found"""

        restaurant_coord_container = soup.find("img", class_="rstinfo-table__map-image")
        try:
            restaurant_coords = restaurant_coord_container.get("data-lazy-src")#This gets the container tabelog uses for the url 
            restaurant_coords = extract_substring_between(restaurant_coords, "center=", "&style")
            restaurant_coords = restaurant_coords.split(",") #Doing this to separate longitude and latitude to turn it into a tuple.
            latitude = float(restaurant_coords[0])
            longitude = float(restaurant_coords[1])
            restaurant_coords_tup = (latitude, longitude)
            
        except AttributeError:
            restaurant_coords_tup = "N/A"
        
        return restaurant_coords_tup
    


    def find_tabelog_url(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurants tabelog webaddress as a str, it will return "N/A" if it could not be found"""

        canonical_tag = soup.find("link", rel="alternate", hreflang = "ja")             #Find the link for the Japanese site (This will work for any language.)
        try:
            tabelog_url = canonical_tag["href"] #Using find as the link is inside the tags as opposed to .get_text()
        except AttributeError:
            tabelog_url = "N/A"
        
        return tabelog_url
    
    def find_opening_hours(self, soup: BeautifulSoup) -> str:
        """This method returns the restaurants opening hours from tabelog in Japanese as a String, it will return "N/A" if it could not be found """

        opening_hours_td = soup.find("th", string="営業時間").find_next("td")  #Finds the table after the heading 営業時間 and takes all the information

        try:
            opening_hours = opening_hours_td.get_text("\n", strip=True)   #Gets the text from this table and if theres breaks or separate lines it joins the text with \n (So new line for us)
        except AttributeError:
            opening_hours = "N/A"
        

        return opening_hours
    
    def find_reservation_info (self, soup: BeautifulSoup) -> str:
        """This method returns the restaurants reservation information from tabelog in Japanese as a String, it will return "N/A" if it could not be found """
        reservation_status_td = soup.find("th", string="予約可否").find_next("td")
        try:
            reservation_info = reservation_status_td.get_text("\n", strip=True)      
        except AttributeError:
            reservation_info = "N/A"   

        return reservation_info
    

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


    
    
    






