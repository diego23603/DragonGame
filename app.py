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
socketio.init_app(app)

# Store states
collectibles_state = {}
user_dragons = {}
user_data = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    emit('user_connected', {'data': 'Connected'})
    emit('collectibles_state', collectibles_state)

@socketio.on('position_update')
def handle_position_update(data):
    sid = request.sid
    user_data[sid] = {
        'x': data['x'],
        'y': data['y'],
        'nickname': data.get('nickname', 'Anonymous'),
        'dragonId': user_dragons.get(sid)
    }
    emit('user_moved', {
        'userId': sid,
        'x': data['x'],
        'y': data['y'],
        'nickname': data.get('nickname', 'Anonymous'),
        'dragonId': user_dragons.get(sid)
    }, broadcast=True)

@socketio.on('nickname_update')
def handle_nickname_update(data):
    sid = request.sid
    if sid in user_data:
        user_data[sid]['nickname'] = data['nickname']
        emit('user_updated', {
            'userId': sid,
            'nickname': data['nickname']
        }, broadcast=True)

@socketio.on('dragon_selected')
def handle_dragon_selected(data):
    sid = request.sid
    user_dragons[sid] = data['dragonId']
    if sid in user_data:
        user_data[sid]['dragonId'] = data['dragonId']
    emit('dragon_selected', {
        'userId': sid,
        'dragonId': data['dragonId']
    }, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in user_data:
        del user_data[sid]
    if sid in user_dragons:
        del user_dragons[sid]
    emit('user_disconnected', {'userId': sid}, broadcast=True)

@socketio.on('chat_message')
def handle_chat_message(data):
    sid = request.sid
    emit('chat_message', {
        'sender': data['sender'],
        'message': data['message'],
        'position': data['position']
    }, broadcast=True)

@socketio.on('collectible_collected')
def handle_collectible_collected(data):
    collectible_id = f"{data['x']}_{data['y']}"
    collectibles_state[collectible_id] = True
    emit('collectible_collected', {
        'x': data['x'],
        'y': data['y']
    }, broadcast=True)

with app.app_context():
    import models
    db.create_all()
