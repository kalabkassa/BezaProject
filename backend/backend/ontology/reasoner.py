from owlready2 import *

# Create ontology
onto = get_ontology(str("ontology/Tirunesh_Patients_Data.rdf")).load()

# Add rules
with onto:
    Imp().set_as_rule("""
        Patient(?p) ^ heart_rate(?p, ?hr) ^ greaterThan(?hr, 60) ^ lessThan(?hr, 100) ^
        temprature(?p, ?temp) ^ greaterThan(?temp, 36.1) ^ lessThan(?temp, 37.2)
        -> hasCondition(?p, Normal)
    """)

    Imp().set_as_rule("""
        Patient(?p) ^ heart_rate(?p, ?hr) ^ greaterThanOrEqual(?hr, 100) ^ lessThan(?hr, 120) ^
        temprature(?p, ?temp) ^ greaterThan(?temp, 37.2) ^ lessThanOrEqual(?temp, 39)
        -> hasCondition(?p, Warning)
    """)

    Imp().set_as_rule("""
        Patient(?p) ^ heart_rate(?p, ?hr) ^ greaterThanOrEqual(?hr, 120) ^
        temprature(?p, ?temp) ^ greaterThan(?temp, 39)
        -> hasCondition(?p, Critical)
    """)

def classify_patient(onto, patient_id: str, hr: float, temp: float) -> str:
    # Create or get individual
    if patient_id in onto:
        patient = onto[patient_id]
    else:
        patient = onto.Patient(patient_id)

    # Set properties
    patient.heart_rate = [hr]
    patient.temprature = [temp]
    print("reasoning......")
    # Run reasoner
    sync_reasoner_pellet(infer_property_values=True)
    print("Reasoned")

    # Return status name or "Unknown"
    statuses = patient.hasCondition
    if statuses:
        return statuses[0].name
    else:
        return "Unknown"
