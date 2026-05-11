# RECSAT – Restriction Enzyme Cut Site Analysis Tool

## About

RECSAT is a web-based bioinformatics tool for restriction enzyme cut site analysis and DNA sequence visualization.

This tool allows users to input DNA sequences and identifies restriction enzyme recognition sites, computes cut sites and fragment sizes relative to the sense strand, and produces a visualization of the resulting DNA sequence.

The system integrates a MySQL database containing Type II restriction enzymes that was derived from REBASE (https://rebase.neb.com/rebase/rebase.html).

## Features

- Identification of restriction enzyme cut and recognition sites in DNA sequences 
- Computation of fragment sizes after enzymatic digestion  
- Visualization of sense and antisense DNA strands  

## System Requirements

- Python 3.x  
- MySQL Server  
- Python package: `mysql-connector-python`  
- Modern web browser (JavaScript enabled) 
- Recommended system resources of 1 GB RAM and 1.8 Ghz CPU per user.
- Recommended network speed of at least 2 Mbps

## Usage (JHU Server)

1. Connect to the JHU VPN and log in to the JHU server.
2. Access the application at the following URL: 
	http://bfx3.aap.jhu.edu/araja5/final-project/
3. Enter a DNA sequence between 10–1000 bp
4. Click “Analyze DNA Sequence”
5. Use pagination to browse results and click on "Reset" to clear input

## Usage (Local Machine)

1. Import the provided enzyme.sql database dump into MySQL
2. Open db_config.py inside the cgi-bin/ directory and modify the MySQL login credentials to match your local MySQL configuration
3. Configure your MySQL username, password, host, and database name inside db_config.py.
4. From the project directory, start a local server:
	python3 -m http.server --cgi 8000
5. Open the application in your browser:
	http://localhost:8000/
6. Enter a DNA sequence between 10–1000 bp
7. Click “Analyze DNA Sequence”
8. Use pagination to browse results and click on "Reset" to clear input


## Project Structure

- count.cgi – Computes and displays the total number of restriction enzymes used by the application.  
- itype2.txt – Contains Type II restriction enzyme information such as enzyme name and recognition sequence with cleavage site.  
- parse.py – Parses `itype2.txt`, filters irregular cleavage notation, and generates a MySQL database.  
- index.html – Provides the main web interface and page structure.  
- app.js – Handles user interaction, fetches backend results, and renders interactive visualizations.  
- analysis.cgi – Processes user input, queries the database, and returns structured JSON results.  
- db_config.py - Stores MySQL database connection credentials used by the CGI backend script.
- style.css – Defines the visual styling and layout of the web interface.
- enzyme.sql - MySQL database dump containing the enzyme table schema

## Notes

- Fragment sizes are calculated using cut positions defined on the sense strand (5' --> 3')
- Antisense strand offsets are used only for visualization  
- "L" denotes the Left Fragment Size and "R" denotes the Right Fragment Size
