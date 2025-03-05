from flask import Flask, render_template,request,jsonify,session
import  sqlite3
import os

app = Flask(__name__)
app.secret_key = '123'  # Required for session storage
UPLOAD_FOLDER = 'static/uploads/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the uploads directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
#Create the database to upload the images and data   puzzle
# Connect to (or create) the database
conn = sqlite3.connect('puzzledatabase.db')
cursor = conn.cursor()

# Create a table to store settings (if it doesn't exist)
cursor.execute('''
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    bg_image TEXT,
    puzzle_image TEXT,
    grid_rows INTEGER ,
    grid_columns INTEGER 
    
)
''')

# Commit and close the connection
conn.commit()
conn.close()
print("Database and table created successfully!")



# Function to save background image in the database
@app.route('/save_bg_image', methods=['POST'])
def save_bg_image():
    if 'bg_image' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['bg_image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save the image
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    # Store the path in the database
    conn = sqlite3.connect('puzzledatabase.db')
    cursor = conn.cursor()

    cursor.execute("UPDATE settings SET bg_image = ? WHERE id = 1", (file_path,))
    if cursor.rowcount == 0:
        cursor.execute("INSERT INTO settings (id, bg_image) VALUES (1, ?)", (file_path,))
    
    conn.commit()
    conn.close()

    return jsonify({"message": "Background image saved successfully", "path": file_path})




@app.route('/get_bg_image', methods=['GET'])
def get_bg_image():
    conn = sqlite3.connect('puzzledatabase.db')
    cursor = conn.cursor()

    cursor.execute("SELECT bg_image FROM settings WHERE id = 1")
    result = cursor.fetchone()
    
    conn.close()

    if result and result[0]:
        return jsonify({"bg_image": result[0]})
    else:
        return jsonify({"bg_image": None})


# Route to save grid settings
# Route to save grid settings
@app.route('/save_grid_settings', methods=['POST'])
def save_grid_settings():
    data = request.json
    grid_rows = data.get('grid_rows')
    grid_columns = data.get('grid_columns')

    if not grid_rows or not grid_columns:
        return jsonify({"error": "Invalid data"}), 400

    conn = sqlite3.connect('puzzledatabase.db')
    cursor = conn.cursor()

    # Check if settings exist
    cursor.execute("SELECT id FROM settings WHERE id = 1")
    existing = cursor.fetchone()

    if existing:
        cursor.execute("UPDATE settings SET grid_rows = ?, grid_columns = ? WHERE id = 1", (grid_rows, grid_columns))
    else:
        cursor.execute("INSERT INTO settings (id, grid_rows, grid_columns) VALUES (1, ?, ?)", (grid_rows, grid_columns))

    conn.commit()
    conn.close()

    return jsonify({"message": "Grid settings saved successfully!"})



# Route to get grid settings
@app.route('/get_grid_settings', methods=['GET'])
def get_grid_settings():
    conn = sqlite3.connect('puzzledatabase.db')
    cursor = conn.cursor()
    cursor.execute("SELECT grid_rows, grid_columns FROM settings WHERE id = 1")
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({"grid_rows": row[0], "grid_columns": row[1]})
    else:
        return jsonify({"grid_rows": 3, "grid_columns": 4})  # Default values





@app.route('/save_puzzle_image', methods=['POST'])
def save_puzzle_image():
    if 'puzzle_image' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['puzzle_image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save the image
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    # Store the path in the database
    conn = sqlite3.connect('puzzledatabase.db')
    cursor = conn.cursor()
    
    cursor.execute("UPDATE settings SET puzzle_image = ? WHERE id = 1", (file_path,))
    if cursor.rowcount == 0:
        cursor.execute("INSERT INTO settings (id, puzzle_image) VALUES (1, ?)", (file_path,))
    
    conn.commit()
    conn.close()

    return jsonify({"message": "Puzzle image saved successfully", "path": file_path})



@app.route('/get_puzzle_image', methods=['GET'])
def get_puzzle_image():
    conn = sqlite3.connect('puzzledatabase.db')
    cursor = conn.cursor()

    cursor.execute("SELECT puzzle_image FROM settings WHERE id = 1")
    result = cursor.fetchone()
    
    conn.close()

    if result and result[0]:
        return jsonify({"puzzle_image": result[0]})
    else:
        return jsonify({"puzzle_image": "static/img/defaultpuzzle.jpg"})





# Route to upload background image
@app.route('/upload_background', methods=['POST'])
def upload_background():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file:
        filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filename)
        save_background(filename)   #Save to database
        return jsonify({'success': True, 'image_url': filename})



   # Route to update toggle state
@app.route('/update_toggle', methods=['POST'])
def update_toggle():
    data = request.get_json()
    session['toggle_state'] = data['toggle']  # Store state in session
    return jsonify({"message": "Toggle state updated!"})

# Route to check toggle state
@app.route('/get_toggle_state', methods=['GET'])
def get_toggle_state():
    return jsonify({"toggle": session.get('toggle_state', False)})










@app.route('/')
def home():
    return render_template('index.html', bg_image='bg_image')

@app.route('/puzzle')
def puzzle():
    return render_template('puzzle.html', bg_image='bg_image',puzzle_image='puzzle_image',grid_rows='grid_rows',grid_columns='grid_columns')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
