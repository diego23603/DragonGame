from app import db
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    x_pos = db.Column(db.Float, default=400)  # Default x position
    y_pos = db.Column(db.Float, default=300)  # Default y position
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    selected_dragon = db.Column(db.String(50))  # Store selected dragon ID
