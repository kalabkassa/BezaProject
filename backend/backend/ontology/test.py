from owlready2 import *

# Create a new ontology
onto = get_ontology("http://test.org/family.owl")

with onto:
    # Define classes
    class Person(Thing):
        pass

    # Define properties
    class age(Person >> int, DataProperty):
        pass

    class hasParent(ObjectProperty):
        domain = [Person]
        range = [Person]

    class hasBrother(ObjectProperty):
        domain = [Person]
        range = [Person]

    class hasUncle(ObjectProperty):
        domain = [Person]
        range = [Person]

    # Create a SWRL rule to infer 'hasUncle'
    # If ?x hasParent ?y AND ?y hasBrother ?z, then ?x hasUncle ?z
    rule = Imp()
    rule.set_as_rule("""
        hasParent(?x, ?y) ^ age(?x, ?a) ^ lessThanOrEqual(?a, 10) ^ hasBrother(?y, ?z) -> hasUncle(?x, ?z)
    """)

# Create individuals
john = Person("John")
john.age = [10]
mary = Person("Mary")
bill = Person("Bill")

john.hasParent = [mary]
mary.hasBrother = [bill]

# Sync the reasoner to infer new facts
# Pellet is a common reasoner that supports SWRL rules
sync_reasoner_pellet(infer_property_values=True)

# Check if John has Bill as an uncle
print(john.hasUncle)
