import sqlite3

conn = sqlite3.connect('word_bank.db')
cursor = conn.cursor()

cursor.execute("SELECT * FROM words")
rows = cursor.fetchall()

conn.close()

for row in rows:
    print(row)
