#!/usr/bin/env python3

import mysql.connector
import os

connection = mysql.connector.connect(
    host="localhost",
    user="root",
    password=os.getenv("DATABASE_PASSWORD"),
    database="renzyme_db"
)

cursor = connection.cursor()

cursor.execute("""
    SELECT COUNT(*) 
    FROM enzyme e
    WHERE e.top_cut IS NOT NULL
    AND e.bottom_cut IS NOT NULL
    """)

count = cursor.fetchone()[0]

cursor.close()
connection.close()

print(f"Total enzymes: {count}")
