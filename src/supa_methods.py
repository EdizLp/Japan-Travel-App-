from .utils import list_to_string
class SupaMethods:

    def __init__(self, client):
            self.client = client
        
    def _upsert(self, table_name, data_list:list) -> dict:

        response = self.client.table(table_name).upsert(data_list).execute()
        return response
    
    def _fetch_data(self, table_name, columns: list =[]) -> dict:
        columns_string = list_to_string(separator = ", ", default_string="*", my_list=columns)
        response = (self.client.table(table_name).select(columns_string).execute())
        return response
    
    
             
        
    
        