from owlready2 import *
from rdflib import *
# from prettytable import PrettyTable

def onto(file_path, usersData, filters):
    onto = get_ontology(str(file_path)).load()
    for userData in usersData:
        individual = onto.Patient(f"user{userData['id']}")
        individual.patient_id.append(userData['id'])
        individual.first_name.append(userData['first_name'])
        individual.last_name.append(userData['last_name'])
        individual.age.append(int(userData['age']))
        individual.temprature.append(float(userData['temprature']))
        individual.heart_rate.append(float(userData['heart_rate']))

    graph = default_world.as_rdflib_graph()
    #graph.get_context(onto)
    graph.bind("onto", "http://www.semanticweb.org/kalab/ontologies/2023/6/untitled-ontology-2#")

    #filters = input("Enter search query: ")
    max_words_per_phrase = 2

    filters = filters.split()
    class_type = ''
    phrases = []
    current_phrase = []
    for word in filters:
        if not class_type:
            class_type = word
        else:
            current_phrase.append(word)
            if len(current_phrase) >= max_words_per_phrase:
                phrases.append(" ".join(current_phrase))
                current_phrase = []

    if current_phrase:
        phrases.append(" ".join(current_phrase))

    filter_statements = []
    for filter_string in phrases:
        filter_parts = filter_string.split(' ')
        filter_statements.append(f'?b onto:{filter_parts[0]} ?{filter_parts[0]}.')
        filter_statements.append(f'FILTER(?{filter_parts[0]} {filter_parts[1]})')

    filter_query = '\n'.join(filter_statements)

    query = f"""
        SELECT ?b ?p ?s
        WHERE {{
            ?b a onto:{class_type}.
            ?b ?p ?s.
            {filter_query}
        }}
    """
    data = list(default_world.sparql_query(query))
    print(data)
    user_data = {}

    for item in data:
        item[0] = str(item[0])
        item[1] = str(item[1])
        item[2] = str(item[2])
        user = item[0].split(".")[1]  # Extract user name from the first element
        stripped_item = [element.replace("Patient_individuals.", "") if isinstance(element, str) else element for element in item[1:]]
 
        if user not in user_data:
            user_data[user] = {"patient_id": None, "first_name": None, "last_name": None, "age": None}
        if stripped_item[0] == "patient_id":
            user_data[user]["patient_id"] = stripped_item[1]
        elif stripped_item[0] == "first_name":
            user_data[user]["first_name"] = stripped_item[1]
        elif stripped_item[0] == "last_name":
            user_data[user]["last_name"] = stripped_item[1]
        elif stripped_item[0] == "age":
            user_data[user]["age"] = stripped_item[1]
        elif stripped_item[0] == "temprature":
            user_data[user]["temprature"] = float(stripped_item[1])
        elif stripped_item[0] == "heart_rate":
            user_data[user]["heart_rate"] = float(stripped_item[1])

    # t = PrettyTable(['Id', 'First Name', 'Last Name', 'Age', 'Temprature', 'Heart Rate'])
    # # Print the updated data for each user
    # for user, user_items in user_data.items():
    #     t.add_row([user_items["patient_id"], user_items["first_name"], user_items["last_name"], user_items["age"]])
    return user_data.items()

if __name__ == "__main__":
  onto()
