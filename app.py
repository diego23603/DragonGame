import os
from flask import Flask, render_template
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
socketio.init_app(app)

# Store collectible states
collectibles_state = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    emit('user_connected', {'data': 'Connected'})
    # Send current collectibles state to new user
    emit('collectibles_state', collectibles_state)

@socketio.on('position_update')
def handle_position_update(data):
    user_id = data['user_id']
    x = data['x']
    y = data['y']
    
    # Update user position in database
    from models import User
    user = User.query.get(user_id)
    if user:
        user.x_pos = x
        user.y_pos = y
        db.session.commit()
    
    # Broadcast position to all other users
    emit('user_moved', data, broadcast=True, include_self=False)

@socketio.on('collectible_collected')
def handle_collectible_collected(data):
    # Create a unique identifier for the collectible
    collectible_id = f"{data['x']}_{data['y']}"
    collectibles_state[collectible_id] = True
    
    # Broadcast to all clients that this collectible was collected
    emit('collectible_collected', {
        'x': data['x'],
        'y': data['y']
    }, broadcast=True)

with app.app_context():
    import models
    db.create_all()
