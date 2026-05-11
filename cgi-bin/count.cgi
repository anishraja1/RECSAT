#!/usr/bin/env python3

import mysql.connector
import sys

from db_config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
connection = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
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
