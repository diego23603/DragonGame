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
user_scores = {}

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
    user_scores[sid] = data.get('score', 0)
    emit('user_moved', {
        'userId': sid,
        'x': data['x'],
        'y': data['y'],
        'dragonId': data.get('dragonId', None),
        'score': data.get('score', 0),
        'username': data.get('username', '')
    }, broadcast=True)

@socketio.on('score_update')
def handle_score_update(data):
    sid = request.sid
    user_scores[sid] = data['score']
    emit('score_update', {
        'userId': sid,
        'score': data['score']
    }, broadcast=True)

# Keep other event handlers unchanged

with app.app_context():
    import models
    db.create_all()
