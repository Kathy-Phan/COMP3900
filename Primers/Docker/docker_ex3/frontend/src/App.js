import React, { useState } from "react";
import axios from "axios";

function App() {
  const [inputText, setInputText] = useState("");
  const [prediction, setPrediction] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:9900/predict", {
        text: inputText,
      });
      setPrediction(response.data);
    } catch (error) {
      console.error("Error fetching prediction:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Sentiment Analysis</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows="4"
          cols="50"
          placeholder="Type your text here..."
        />
        <br />
        <button type="submit">Get Prediction</button>
      </form>
      {prediction && (
        <div style={{ marginTop: "20px" }}>
          <h3>Prediction</h3>
          <p>Label: {prediction.label}</p>
          <p>Score: {prediction.score}</p>
        </div>
      )}
    </div>
  );
}

export default App;
