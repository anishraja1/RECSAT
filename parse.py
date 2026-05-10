import re
import mysql.connector
import os

# Environmental variable required:
# DATABASE_PASSWORD must be set before running the script
# Example (Mac/Linux): export DATABASE_PASSWORD="your_password"

def main():
    password = os.getenv("DATABASE_PASSWORD")
    if not password:
        raise ValueError("DATABASE_PASSWORD environment variable not set")
    
    # Connect to database
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password=password,
        database="renzyme_db"
    )
    cursor = connection.cursor()

    # Opens the file
    with open("itype2.txt", "r") as file:
        for line in file:
            line = line.strip()
            if not line:
                continue

            # Splits by tabs
            parts = line.split("\t")

            # Skips non-data related lines (at the beginning)
            if len(parts) < 3:
                continue

            enzyme_name = parts[0]
            seq = parts[2].strip()

            # Skips invalid recognition sequences
            if (
                not re.search(r'[ATCG]', seq)
                or not re.match(r'^[ATCGNRYSWKMBDHV0-9\^\(\)/,-]+$', seq)
            ):
                continue

            # Now we will filter the field corresponding to "recognition site with cleavage site"
            top_cut = None
            bottom_cut = None
            clean_seq = None

            # Case 1: Caret notation
            # Example: GA^ATTC
            if "^" in seq:
                top_cut = seq.index("^")
                bottom_cut = top_cut
                clean_seq = seq.replace("^", "")

            # Case 2: Prefix/suffix offset notation
            # Example: (7/12)GAANNNNNNNTTGG(11/6)
            elif re.search(r'^\(-?\d+/-?\d+\)', seq):

                # Extract the recognition sequence
                seq_match = re.search(r'([ATCGNRYSWKMBDHV]+)', seq)

                if seq_match:
                    clean_seq = seq_match.group(1)

                # Extract the first cut pair
                cuts = re.search(r'^\((-?\d+)/(-?\d+)\)', seq)
                if cuts:
                    top_cut = int(cuts.group(1))
                    bottom_cut = int(cuts.group(2))
                else:
                    continue

            # Case 3: Separate cleavage notation where recognition sequence and cleavage info are in separate columns
            # Example: ACCGAG	5(6)

            elif len(parts) > 3 and re.match(r'^\d+\(\d+\)$', parts[3].strip()):
                clean_seq = seq
                cuts = re.match(r'^(\d+)\((\d+)\)$', parts[3].strip())
                top_cut = int(cuts.group(1))
                bottom_cut = int(cuts.group(2))

            # Case 4: A plain sequence with no cut info
            # Example: GGATCC
            else:
                clean_seq = seq

            # Skip enzymes with cuts outside recognition site
            if top_cut is not None and (
                top_cut < 0 or top_cut > len(clean_seq)
            ):
                continue

            if bottom_cut is not None and (
                bottom_cut < 0 or bottom_cut > len(clean_seq)
            ):
                continue

            # Insert into the database
            cursor.execute(
                "INSERT IGNORE INTO enzyme (enzyme_name, recognition_sequence, top_cut, bottom_cut) VALUES (%s, %s, %s, %s)",
                (enzyme_name, clean_seq, top_cut, bottom_cut)
            )

    connection.commit()
    cursor.close()
    connection.close()

    print("Loading Complete.")

if __name__ == "__main__":
    main()