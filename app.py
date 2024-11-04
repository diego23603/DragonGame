import os
from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from sqlalchemy.orm import DeclarativeBase
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

db.init_app(app)
socketio.init_app(app, cors_allowed_origins="*")

# Store states
collectibles_state = {}
user_dragons = {}
user_positions = {}

@app.route('/')
def index():
    return render_template('index.html')

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
