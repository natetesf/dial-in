import sqlite3

# List of 10-letter words (you can modify this list)
# add new words here!
word_list = [
    "prejudiced"
]

# Connect to the database
conn = sqlite3.connect('daily_words.db')
cursor = conn.cursor()

# Insert words into the database
for word in word_list:
    cursor.execute("INSERT INTO WORD_TODAY (word) VALUES (?)", (word,))

# Commit and close
conn.commit()
conn.close()

print("Words added successfully!")
