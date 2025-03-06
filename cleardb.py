import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('word_bank.db')
cursor = conn.cursor()

# Delete all records from the words table
cursor.execute("DELETE FROM words")

# Commit the changes and close the connection
conn.commit()
conn.close()

print("All words have been deleted from the database.")
