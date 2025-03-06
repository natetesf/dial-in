# Use official Python image
FROM python:3.9

# Set the working directory inside the container
WORKDIR /app

# Copy local project files into the container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5000 for Flask
EXPOSE 5000

# Run the Flask app
CMD ["flask", "run", "--host=0.0.0.0"]
