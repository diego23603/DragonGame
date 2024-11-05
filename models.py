from app import db
from flask_login import UserMixin

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    x_pos = db.Column(db.Float, default=0)
    y_pos = db.Column(db.Float, default=0)
    sprite = db.Column(db.String(120), default='character_sprite.svg')
    last_login = db.Column(db.DateTime)
