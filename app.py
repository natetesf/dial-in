from flask import Flask, render_template, request, jsonify
from datetime import date, datetime

import psycopg2
import random
import os
import pytz

app = Flask(__name__)

# Localize the START_DATE to CST and set it to midnight
CST = pytz.timezone('America/Chicago')
START_DATE = datetime(2025, 4, 17, 0, 0, 0, 0)  # Midnight of 2025-04-18
START_DATE = CST.localize(START_DATE)  # Localize to CST

WORD_FILE_PATH = "words.txt"

def get_current_word():
    """Retrieve the word of the day based on Chicago (CST/CDT) time."""
    chicago_tz = pytz.timezone('America/Chicago')
    current_date = datetime.now(chicago_tz).strftime('%Y-%m-%d')

    try:
        with open(WORD_FILE_PATH, 'r') as file:
            for line in file:
                date, word = line.strip().split(', ')  # Split date and word by comma
                if date == current_date:
                    return word
        return "ERROR WORD"
    except FileNotFoundError:
        return "ERROR WORD"

def get_game_number():
    """Calculate the game number based on the days elapsed since START_DATE."""
    today = datetime.now(CST).date()  # Get today's date in CST
    delta = (today - START_DATE.date()).days  # Ensure we compare only the dates
    return delta + 1  # Game #1 starts today

def convert_word_to_number(word):
    """Convert a 10-letter word or phrase into a number sequence based on the phone keypad."""
    keypad = {
        'a': '2', 'b': '2', 'c': '2',
        'd': '3', 'e': '3', 'f': '3',
        'g': '4', 'h': '4', 'i': '4',
        'j': '5', 'k': '5', 'l': '5',
        'm': '6', 'n': '6', 'o': '6',
        'p': '7', 'q': '7', 'r': '7', 's': '7',
        't': '8', 'u': '8', 'v': '8',
        'w': '9', 'x': '9', 'y': '9', 'z': '9',
        ' ': '0'  # Spaces are represented as 0
    }
    return ''.join(keypad[char] if char in keypad else '-' for char in word.lower())


@app.route('/')
def index():
    """Render the main game page with the game number and date."""
    word = get_current_word()
    number_code = convert_word_to_number(word) if word else "0000000000"

    # ✅ Get dynamic game number and formatted date
    game_number = get_game_number()
    current_date = date.today().strftime("%B %d, %Y")  # Example: February 27, 2025

    return render_template(
        'index.html',
        number_code=number_code,
        game_number=game_number,
        current_date=current_date
    )

@app.route("/submit", methods=["POST"])
def submit_guess():
    data = request.get_json()
    guess = data.get("guess", "").upper()
    correct_word = get_current_word().upper()
    remaining_attempts = int(data.get("remainingAttempts", 1))  # Defaults to 1 if missing
    print(remaining_attempts)

    if len(guess) != len(correct_word):
        return jsonify({"result": "error", "message": "Invalid guess length"}), 400
    matches = [i for i in range(len(guess)) if guess[i] == correct_word[i]]

    if guess == correct_word:
        return jsonify({
            "result": "correct",
            "matches": matches,
            "word": correct_word
        })
    elif remaining_attempts <= 1:
        return jsonify({
            "result": "incorrect",
            "matches": matches,
            "word": correct_word
        })
    else:
        return jsonify({
            "result": "incorrect",
            "matches": matches,
        })

if __name__ == '__main__':
    app.run(debug=True)