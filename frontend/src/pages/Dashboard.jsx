import { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import "../App.css";


function Dashboard() {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState("Waiting");
  const [name, setName] = useState("--");
  const [studentId, setStudentId] = useState("--");
  const [attendance, setAttendance] = useState("--");
  const [scanning, setScanning] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);

  
  function sleep(ms) {

  return new Promise(
    resolve => setTimeout(resolve, ms)
  );

}
  async function startScan() {
    setScanning(true);

  console.log("Scanning started");

  const frames = [];

  for (let i = 1; i <= 3; i++) {

    const image =
      webcamRef.current.getScreenshot();

    frames.push(image);

    await sleep(300);

  }

  const response = await fetch(
  "http://127.0.0.1:8000/recognize",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      frames: frames
    })
  }
);

const data = await response.json();

setStatus(data.status);

setName(data.name);

setStudentId(data.student_id);
setAttendance(
  data.attendance_status
);
setScanning(false);

fetchStats();


}

    useEffect(() => {

        fetchStats();

        }, []);

    async function fetchStats() {

        const response = await fetch(
            "http://127.0.0.1:8000/dashboard-stats"
        );

        const data = await response.json();

        setTotalStudents(
            data.total_students
        );

        setTodayAttendance(
            data.today_attendance
        );

    }

  return (
    <div className="container">

        <h1>AI Attendance System</h1>

        <div className="stats-container">

            <div className="stat-card">

                <h3>👨‍🎓 Total Students</h3>

                <p>{totalStudents}</p>

            </div>

            <div className="stat-card">

                <h3>✅ Today's Attendance</h3>

                <p>{todayAttendance}</p>

            </div>

        </div>

      <div className="camera-box">

        <Webcam
          ref={webcamRef}
          mirrored={true}
          audio={false}
          screenshotFormat="image/jpeg"
          className="webcam"
        />

      </div>

      <div className="info-box">

        <div className="info-row">
            <span className="info-label">
            Status
            </span>

            <span className="info-value">
            {status}
            </span>
        </div>

        <div className="info-row">
            <span className="info-label">
            Name
            </span>

            <span className="info-value">
            {name}
            </span>
        </div>

        <div className="info-row">
            <span className="info-label">
            Student ID
            </span>

            <span className="info-value">
            {studentId}
            </span>
        </div>

        <div className="info-row">
            <span className="info-label">
            Attendance
            </span>

            <span className="info-value">
            {attendance}
            </span>
        </div>

        </div>

      <button
        onClick={startScan}
        disabled={scanning}
      >
        {scanning
          ? "Scanning..."
          : "Start Scan"}
      </button>

    </div>
  )
}

export default Dashboard;