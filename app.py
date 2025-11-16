from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "your secret key")

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def handle_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # TODO Implement actual authentication 
    #  this is a placeholder
    if email and password:
        session['user'] = email
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/register', methods=['POST'])
def handle_register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    confirm_password = data.get('confirmPassword')
    
    # TODO Implement actual registration 
    # this is also a placeholder
    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
    
    if email and password:
        session['user'] = email
        return jsonify({'success': True, 'message': 'Registration successful'})
    
    return jsonify({'success': False, 'message': 'Invalid input'}), 400

@app.route('/dashboard')
def dashboard():
    # TODO Create dashboard 
    return "Dashboard (to be done)"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
