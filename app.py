from flask import Flask, redirect, render_template, request, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO

import random
import time
import os

port = 5000

current       = f"{os.getcwd()}\\"
wordlist      = f"{current}wordlist.10000"
DATABASE      = f"{current}sql\\database.db"  # leaderboard-ის მონაცემების შესანახად
TEMPLATES_DIR = os.path.abspath("templates")
STATIC_DIR    = os.path.abspath("static")

app = Flask(__name__, template_folder=TEMPLATES_DIR, static_folder=STATIC_DIR)
app.config["SECRET_KEY"]              = "Ks1l$0.fn&2*HKQ3/w%@8"
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DATABASE}"

db       = SQLAlchemy(app)
socketio = SocketIO(app)


class User(db.Model):
    id    = db.Column(db.Integer, primary_key=True)
    name  = db.Column(db.String(80), nullable=False, unique=True)
    email = db.Column(db.String(40), nullable=False, unique=False)
    ip    = db.Column(db.String(30), nullable=False, unique=False)
    score = db.Column(db.Integer,    nullable=False, unique=False)

    def __repr__(self):
        return f"User('{self.name}', '{self.email}', '{self.ip}', '{self.score}')"

    def __init__(self, name, ip, score, email="none"):
        self.name  = name
        self.ip    = ip
        self.score = score
        self.email = email


@app.route("/home")
@app.route("/")
def index():
    users = [["", "name", "email(optional)", "score"], ]
    for n, user in enumerate(User.query.all()):
        users.append([f"#{n+1}", user.name, user.email, user.score])

    return render_template("index.html", users=users)


@app.route("/start/")
def gameplay():
    return render_template("gameplay.html")


@socketio.on("time")
def time_to_start(json):
    phases = [3, 2, 1, "GO", ""]
    for i in phases:
        socketio.emit("time", {"time": i})
        socketio.sleep(1.1)

    start_game()


def start_game():
    n = 0
    while session["online"] and session["playing"]:
        socketio.sleep(session["speed"])
        number = random.randint(0, 10000) # 10 000
        word   = words[number]
        print("sent:", word)
        socketio.emit("word", {"w": word,
                               "num": random.randint(12, 85),
                               "class_n": n})
        n += 1
        # break


@socketio.on("joined")
def handle_my_custom_event(json, methods=["POST", "GET"]):
    # ip_address = request.remote_addr
    # session["ip_address"] = ip_address
    session["online"]  = True
    session["playing"] = True
    session["speed"]   = 2.2


@socketio.on("disconnect")
def diconnect_user():
    # ip = session.get("ip_address")
    session["online"] = False


@socketio.on("done")
def done_counting(json):
    session["playing"] = False


@socketio.on("speedup")
def speed_up():
    session["speed"] -= 0.09


@socketio.on("score")
def save_score(json):
    uname = json["username"]
    if uname not in [user.name for user in User.query.all()] and uname != "":
        user = User(uname, request.remote_addr, json["score"], json["email"])
        db.session.add(user)
        db.session.commit()
        socketio.emit('redirect', {'url': f'http://127.0.0.1:{port}/'})
    else:
        socketio.emit("invalid-usr", {})


def init_db():
    db.drop_all()
    db.create_all()
    db.session.commit()


def main():
    global words

    with open(wordlist, "r") as wl:
        words = wl.readlines()

    init_db()
    socketio.run(app, debug=True)  # app.run(debug=True)


if __name__ == "__main__":
    main()
