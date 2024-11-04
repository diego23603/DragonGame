import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from sqlalchemy.orm import DeclarativeBase
import json
from datetime import datetime

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

# Store states
user_dragons = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    emit('user_connected', {'data': 'Connected'})

@socketio.on('position_update')
def handle_position_update(data):
    sid = request.sid
    username = data.get('username')
    x = data.get('x', 400)
    y = data.get('y', 300)
    
    if username:
        # Update position in database
        from models import User
        user = User.query.filter_by(username=username).first()
        if user:
            user.x_pos = x
            user.y_pos = y
            db.session.commit()

    emit('user_moved', {
        'userId': sid,
        'username': username,
        'x': x,
        'y': y,
        'dragonId': data.get('dragonId')
    }, broadcast=True)

@socketio.on('authenticate')
def handle_authenticate(data):
    from models import User
    username = data.get('username')
    user = User.query.filter_by(username=username).first()
    if user:
        # Update last login time
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        emit('authenticated', {
            'username': username,
            'position': {'x': user.x_pos, 'y': user.y_pos},
            'selectedDragon': user.selected_dragon
        })

@socketio.on('dragon_selected')
def handle_dragon_selected(data):
    sid = request.sid
    username = data.get('username')
    dragon_id = data.get('dragonId')
    
    if username:
        from models import User
        user = User.query.filter_by(username=username).first()
        if user:
            user.selected_dragon = dragon_id
            db.session.commit()
    
    emit('dragon_selected', {
        'userId': sid,
        'dragonId': dragon_id
    }, broadcast=True)

with app.app_context():
    import models
    db.create_all()
