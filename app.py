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

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    emit('user_connected', {'data': 'Connected'})

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

with app.app_context():
    import models
    db.create_all()
