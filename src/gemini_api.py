from google import genai




class GeminiManager:
    def __init__(self, api_key:str | None = None):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash"



    def process_json(self, prompt: str, config: dict, schema: dict | None = None) -> any:  #Dict or None, with default value being None 
        """This function takes a prompt (str), a config (Dict) and a schema (dict or defaults to none).
        It sends a request to Gemini 2.0 flash and saves the response as a parsed python oject.
        
        """
        
        if schema: 
            config["response_schema"] = schema



        response = self.client.models.generate_content(
            model= self.model,
            contents=prompt,
            config=config
        )
        
        return response.parsed          #returns it as a python object

