import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from sqlalchemy.orm import DeclarativeBase
import json
from werkzeug.security import check_password_hash
import jwt

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

def get_user_from_token(token):
    try:
        from models import User
        payload = jwt.decode(token.split(' ')[1], app.secret_key, algorithms=['HS256'])
        user = User.query.filter_by(username=payload['username']).first()
        return user
    except Exception as e:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/update-nickname', methods=['POST'])
def update_nickname():
    try:
        # Get authorization token
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Authorization header is missing'}), 401
        
        # Get user from token
        user = get_user_from_token(auth_header)
        if not user:
            return jsonify({'message': 'Invalid or expired token'}), 401

        # Get and validate nickname from request
        data = request.get_json()
        if not data or 'nickname' not in data:
            return jsonify({'message': 'Nickname is required'}), 400
        
        nickname = data['nickname'].strip()
        if len(nickname) < 2 or len(nickname) > 64:
            return jsonify({'message': 'Nickname must be between 2 and 64 characters'}), 400

        # Update user's nickname
        user.nickname = nickname
        db.session.commit()

        return jsonify({
            'message': 'Nickname updated successfully',
            'nickname': nickname
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating nickname: {str(e)}'}), 500

@socketio.on('connect')
def handle_connect():
    emit('user_connected', {'data': 'Connected'})
    emit('collectibles_state', collectibles_state)

@socketio.on('position_update')
def handle_position_update(data):
    sid = request.sid
    emit('user_moved', {
        'userId': sid,
        'x': data['x'],
        'y': data['y'],
        'dragonId': data.get('dragonId', None)
    }, broadcast=True)

@socketio.on('dragon_selected')
def handle_dragon_selected(data):
    sid = request.sid
    user_dragons[sid] = data['dragonId']
    emit('dragon_selected', {
        'userId': sid,
        'dragonId': data['dragonId']
    }, broadcast=True)

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
