from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)
CORS(app)

classifier = pipeline('sentiment-analysis')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    prediction = classifier(data['text'])[0]
    return jsonify(prediction)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9900)
