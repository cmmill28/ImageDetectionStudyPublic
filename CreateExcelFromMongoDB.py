import pandas as pd
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("")
db = client['DSSActivityDB']

# Function to format the selectedOption field
def format_selected_option(option):
    if isinstance(option, dict) and 'type' in option and 'expertise' in option:
        return f"{option['type'].capitalize()}, {option['expertise'].capitalize()}"
    return option

# Function to flatten the data field in surveys collection
def flatten_survey_data(document):
    if 'data' in document and isinstance(document['data'], dict):
        for key, value in document['data'].items():
            document[key] = value
        del document['data']
    return document

# Function to flatten the users collection data
def flatten_users_data(document):
    # Flatten userSession
    if 'userSession' in document and isinstance(document['userSession'], list):
        for i, us in enumerate(document['userSession']):
            document[f'userSession_{i+1}_dssOption1_type'] = us.get('dssOption1', {}).get('type', '')
            document[f'userSession_{i+1}_dssOption1_expertise'] = us.get('dssOption1', {}).get('expertise', '')
            document[f'userSession_{i+1}_dssOption2_type'] = us.get('dssOption2', {}).get('type', '')
            document[f'userSession_{i+1}_dssOption2_expertise'] = us.get('dssOption2', {}).get('expertise', '')
            document[f'userSession_{i+1}_imageSet'] = us.get('imageSet', '')
        del document['userSession']

    # Flatten selectedOption
    if 'selectedOption' in document and isinstance(document['selectedOption'], dict):
        document['selectedOption_type'] = document['selectedOption'].get('type', '')
        document['selectedOption_expertise'] = document['selectedOption'].get('expertise', '')
        del document['selectedOption']

    # Remove practiceQuestions entirely
    if 'practiceQuestions' in document:
        del document['practiceQuestions']

    return document

# Function to export collection to Excel
def export_collection_to_excel(collection_name, excel_writer):
    collection = db[collection_name]
    data = list(collection.find())
    
    # Check and format the selectedOption field if it exists in the documents
    if collection_name == 'assistance_selection':
        for document in data:
            if 'selectedOption' in document:
                document['selectedOption'] = format_selected_option(document['selectedOption'])
            if 'unselectedOption' in document:
                document['unselectedOption'] = format_selected_option(document['unselectedOption'])

    # Flatten the data field in surveys collection
    if collection_name == 'surveys':
        data = [flatten_survey_data(document) for document in data]

    # Flatten the users collection data
    if collection_name == 'users':
        data = [flatten_users_data(document) for document in data]

    df = pd.DataFrame(data)
    
    # Drop the MongoDB '_id' field if it exists
    if '_id' in df.columns:
        df.drop('_id', axis=1, inplace=True)
    
    df.to_excel(excel_writer, sheet_name=collection_name, index=False)
    print(f"Data from collection '{collection_name}' exported successfully!")

# Create an Excel writer
excel_writer = pd.ExcelWriter('output.xlsx', engine='openpyxl')

# List of collections to export
collections = ['assistance_selection', 'assisted_round_log', 'practice_log', 'surveys', 'users']

for collection_name in collections:
    export_collection_to_excel(collection_name, excel_writer)

# Save the Excel file
excel_writer._save()
excel_writer.close()

print("All data exported to output.xlsx successfully!")
