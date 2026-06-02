import { useState, useRef } from "react";
import Webcam from "react-webcam";

function Register() {

    const webcamRef = useRef(null);

    const [studentId, setStudentId] = useState("");

    const [name, setName] = useState("");

    const [status, setStatus] = useState("Waiting");
    const [message, setMessage] = useState("");

    const [registering, setRegistering] = useState(false);

    function sleep(ms) {

        return new Promise(
            resolve => setTimeout(resolve, ms)
        );

        }

    async function registerStudent() {

    const frames = [];

    for (let i = 1; i <= 3; i++) {

        const image =
        webcamRef.current.getScreenshot();

        frames.push(image);

        await sleep(300);

    }
    setRegistering(true);
    const response = await fetch(
        "http://127.0.0.1:8000/register",
        {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            student_id: Number(studentId),
            name: name,
            frames: frames
        })
        }
    );

    const data =
        await response.json();

    setRegistering(false);

    if (data.status === "REGISTERED") {

        setStatus("SUCCESS");

        setMessage(
            `${data.name} registered successfully`
        );

        }

        else if (
        data.status === "STUDENT_ALREADY_EXISTS"
        ) {

        setStatus("ERROR");

        setMessage(
            "Student already exists"
        );

        }

        else if (
        data.status === "FAKE_FACE"
        ) {

        setStatus("ERROR");

        setMessage(
            "Fake face detected"
        );

        }

        else if (
        data.status === "NO_FACE_DETECTED"
        ) {

        setStatus("ERROR");

        setMessage(
            "No face detected"
        );

}

    }


    return (

    <div className="container">

        <h1>Register Student</h1>
        <div className="register-form">

        <input
        type="number"
        placeholder="Student ID"
        value={studentId}
        onChange={(e) =>
            setStudentId(e.target.value)
        }
        />

        <br /><br />

        <input
        type="text"
        placeholder="Student Name"
        value={name}
        onChange={(e) =>
            setName(e.target.value)
        }
        />
        </div>

        {message && (

            <div className="success-box">

                {message}

            </div>

        )}

        <div className="guidelines-card">

            <h3>Registration Guidelines</h3>

            <ul>

                <li>✅ Look directly at the camera</li>

                <li>✅ Ensure proper lighting</li>

                <li>✅ Keep face clearly visible</li>

            </ul>

        </div>

        <div className="webcam-card">
            <h3>Face Registration Camera</h3>

        <div className="camera-box">
        <Webcam
            ref={webcamRef}
            mirrored={true}
            audio={false}
            screenshotFormat="image/jpeg"
            className="webcam"
        />
        </div>
        </div>

        <div className="info-box">

            <p>
                <strong>Status:</strong> {status}
            </p>

            <p>
                <strong>Message:</strong> {message}
            </p>

        </div>

        <button 
        disabled={registering}
        onClick={registerStudent}
        >
            {registering
            ? "Registering..."
            : "Register Student"
            }
        </button>

    </div>

    );
    }

export default Register;