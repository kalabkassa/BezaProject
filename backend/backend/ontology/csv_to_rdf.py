import csv
from owlready2 import *
from rdflib import *


def read_csv_file(file_path):
    try:
        patients = []
        with open(file_path, mode='r') as csvfile:
            csvreader = csv.reader(csvfile)

            # Reading the rest of the file
            for row in csvreader:
                patients.append(row)
    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
    return patients

def onto(file_path, usersData):
    onto = get_ontology(str(file_path)).load()
    # diabetes = list(onto.search(iri="*Diabetes"))[0]
    diabetes = onto.Condition("Diabetes")
    hypertension = onto.Condition("Hypertension")

    for userData in usersData:
        individual = onto.Patient(f"user{userData['id']}")
        if(int(userData['RBS']) > 126):
            individual.hasCondition.append(diabetes)
        if(int(userData['systolic']) > 130 or int(userData['diastolic']) > 80):
            individual.hasCondition.append(hypertension)

        individual.patient_id.append(userData['id'])
        individual.first_name.append(userData['first_name'])
        individual.last_name.append(userData['last_name'])
        individual.gender.append(userData['gender'])
        individual.age.append(int(userData['age']))
        individual.temprature.append(float(userData['temprature']))
        individual.heart_rate.append(float(userData['heart_rate']))
        individual.systolic.append(float(userData['systolic']))
        individual.diastolic.append(float(userData['diastolic']))
        individual.RBS.append(float(userData['RBS']))
        individual.weight.append(float(userData['weight']))
        individual.BMI.append(float(userData['BMI']))

    graph = default_world.as_rdflib_graph()
    # graph.get_context(onto)
    onto.save(file_path.replace(".rdf", "_mod.rdf"))
    graph.bind("onto", "http://www.semanticweb.org/kalab/ontologies/2023/6/untitled-ontology-2#")


if __name__ == "__main__":
    # Replace 'your_file.csv' with your actual CSV file path
    file_path = 'merged.csv'
    patients = read_csv_file(file_path)

    usersData = [{'id': patient[0], 'first_name': patient[7], 'last_name': patient[8], 'gender': patient[10],'age': patient[9],
                  'temprature': patient[2], 'heart_rate': patient[1], 'systolic': patient[3], 'diastolic': patient[4], 'RBS': patient[11],
                  'weight': patient[5], 'BMI': patient[6]} for patient in patients]

    file_path = 'Tirunesh_Patients_Data.rdf'
    onto(file_path, usersData)
