import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from sqlalchemy.orm import DeclarativeBase
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import json

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
socketio = SocketIO()

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["JWT_SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY") or "jwt_secret"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

# Initialize extensions
db.init_app(app)
socketio.init_app(app, cors_allowed_origins="*")
jwt = JWTManager(app)

# Store states
collectibles_state = {}
user_dragons = {}
user_positions = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"message": "Missing username or password"}), 400

        username = data['username']
        password = data['password']

        if len(username) < 3 or len(password) < 6:
            return jsonify({"message": "Username must be at least 3 characters and password at least 6 characters"}), 400

        # Check if user already exists
        existing_user = db.session.execute(
            db.select(models.User).filter_by(username=username)
        ).scalar()
        
        if existing_user:
            return jsonify({"message": "Username already exists"}), 400

        # Create new user
        password_hash = generate_password_hash(password)
        new_user = models.User(
            username=username,
            password_hash=password_hash,
            email=f"{username}@example.com"  # Placeholder email
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({"message": "User registered successfully"}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {str(e)}")
        return jsonify({"message": "Server error during registration"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"message": "Missing username or password"}), 400

        username = data['username']
        password = data['password']

        # Find user
        user = db.session.execute(
            db.select(models.User).filter_by(username=username)
        ).scalar()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"message": "Invalid username or password"}), 401

        # Create access token
        access_token = create_access_token(
            identity=username,
            additional_claims={"user_id": user.id}
        )

        return jsonify({
            "message": "Login successful",
            "token": access_token,
            "username": username
        }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"message": "Server error during login"}), 500

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    emit('user_connected', {'data': 'Connected'})
    # Send current state to new user
    emit('collectibles_state', list(collectibles_state.values()))
    
    # Send current user positions
    for user_id, data in user_positions.items():
        if user_id != request.sid:
            emit('user_moved', {
                'userId': user_id,
                'x': data['x'],
                'y': data['y'],
                'dragonId': data.get('dragonId'),
                'username': data.get('username', 'Unknown')
            })

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in user_positions:
        del user_positions[request.sid]
    emit('user_disconnected', {'userId': request.sid}, broadcast=True)

@socketio.on('position_update')
def handle_position_update(data):
    sid = request.sid
    user_positions[sid] = {
        'x': data['x'],
        'y': data['y'],
        'dragonId': data.get('dragonId'),
        'username': data.get('username', 'Unknown')
    }
    
    emit('user_moved', {
        'userId': sid,
        'x': data['x'],
        'y': data['y'],
        'dragonId': data.get('dragonId'),
        'username': data.get('username', 'Unknown')
    }, broadcast=True)

@socketio.on('dragon_selected')
def handle_dragon_selected(data):
    sid = request.sid
    user_dragons[sid] = data['dragonId']
    emit('dragon_selected', {
        'userId': sid,
        'dragonId': data['dragonId'],
        'username': data.get('username', 'Unknown')
    }, broadcast=True)

@socketio.on('collectible_collected')
def handle_collectible_collected(data):
    collectible_id = data['id']
    collectibles_state[collectible_id] = {
        'id': collectible_id,
        'x': data['x'],
        'y': data['y'],
        'collected': True,
        'collectedBy': data.get('collectedBy', 'Unknown')
    }
    
    emit('collectible_collected', {
        'id': collectible_id,
        'x': data['x'],
        'y': data['y'],
        'collectedBy': data.get('collectedBy', 'Unknown')
    }, broadcast=True)

with app.app_context():
    import models
    db.create_all()
