from flask import Flask
from flask_cors import CORS

"""
Basic Skeleton for a Flask app that you can use in a docker container.
"""

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 

@app.route('/')
def passes():
    return 'PASSED'

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
