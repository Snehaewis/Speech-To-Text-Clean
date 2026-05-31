import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an audio file");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/upload",
        formData
      );

      setTranscription(res.data.transcription);
    } catch (error) {
      console.log(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Speech to Text App
        </h1>

        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full border p-3 rounded"
        />

        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700"
        >
          {loading ? "Transcribing..." : "Upload & Transcribe"}
        </button>

        {transcription && (
          <div className="mt-6 bg-gray-50 p-4 rounded border">
            <h2 className="font-bold mb-2">Transcription:</h2>
            <p>{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;