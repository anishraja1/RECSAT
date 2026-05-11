#!/usr/bin/env python3
import json
import os
import sys
import re
import mysql.connector
import urllib.parse

from db_config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# Data dictionary for IUPAC to regex conversion.
IUPAC = {
    "A": "A",
    "T": "T",
    "G": "G",
    "C": "C",
    "N": "[ATCG]",
    "R": "[AG]",
    "Y": "[CT]",
    "S": "[GC]",
    "W": "[AT]",
    "K": "[GT]",
    "M": "[AC]",
    "B": "[CGT]",
    "D": "[AGT]",
    "H": "[ACT]",
    "V": "[ACG]"
    }   
    
def dna_to_regex(recognition_seq):
    return "".join(IUPAC.get(base, base) for base in recognition_seq)

# - - - - - - - - - - - - - - Data Validation - - - - - - - - - - - - - - - - - 

# Parse the URL query parameters
query = os.environ.get("QUERY_STRING", "")
params = urllib.parse.parse_qs(query)
sequence = params.get("sequence", [""])[0]

# Validate the input
sequence = sequence.upper()
response = {"message": "No results generated"}

if len(sequence) < 10 or len(sequence) > 1000:
    response = {"message": "Sequence must be between 10 and 1000 base pairs."}

elif not re.fullmatch(r"[ATCG]+", sequence):
    response = {"message": "Sequence must only contain A, T, G, and C"}

else:
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )

        cursor = connection.cursor()
        cursor.execute("SELECT enzyme_name, recognition_sequence, top_cut, bottom_cut FROM enzyme")
        enzymes = cursor.fetchall()

        results = []

        for enzyme_name, recog_seq, top_cut, bottom_cut in enzymes:

            if not recog_seq or top_cut is None:
                continue

            # Converts recognition sequence into regex pattern
            pattern = re.compile(dna_to_regex(recog_seq))

            cuts = []

            for match in pattern.finditer(sequence):
                match_start = match.start()

                # Stores the cleavage positions for each match
                cuts.append({
                    "position": match_start,
                    "top": match_start + top_cut,
                    "bottom": match_start + bottom_cut
                })

            if not cuts:
                continue
            # Sorts the cuts from left to right along the sequence
            cuts.sort(key=lambda c: c["top"])

            # Calculates the fragment sizes generated after digestion
            fragments = []
            prev = 0

            for cut in cuts:
                fragments.append(cut["top"] - prev)
                prev = cut["top"]

            fragments.append(len(sequence) - (prev))

            results.append({
                "enzyme": enzyme_name,
                "recognition_sequence": recog_seq,
                "cuts": cuts,
                "fragments": fragments
            })

        cursor.close()
        connection.close()

        response = {"results": results}

    except Exception as e:
        response = {"message": str(e)}

# - - - - - - - - - - - - - - Sending Response - - - - - - - - - - - - - - - - - 
# Send response headers and JSON response
print("Content-Type: application/json")
print()
print(json.dumps(response))