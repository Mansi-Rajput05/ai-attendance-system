import { useEffect, useState } from "react";

function Attendance() {

  const [records, setRecords] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {

    fetchAttendance();

  }, []);

  async function fetchAttendance() {

    let url =
        "http://127.0.0.1:8000/attendance";

    const params = [];

    if (studentId) {

        params.push(
        `student_id=${studentId}`
        );

    }

    if (date) {

        params.push(
        `date=${date}`
        );

    }

    if (params.length > 0) {

        url +=
        "?" + params.join("&");

    }

    const response =
        await fetch(url);

    const data =
        await response.json();

    setRecords(data);

    }

    function downloadCSV() {

        window.open(
            "http://127.0.0.1:8000/download-attendance",
            "_blank"
        );

    }

  return (

    <div>

      <h1>Attendance Records</h1>

      <div className="search-panel">
        <h3>Search Attendance</h3>

        <input
            type="number"
            placeholder="Student ID"
            value={studentId}
            onChange={(e) =>
                setStudentId(e.target.value)
            }
            />

        <input
            type="date"
            value={date}
            onChange={(e) =>
                setDate(e.target.value)
            }
        />

        <button
            onClick={fetchAttendance}
        >
            Search
        </button>

        <button
            onClick={() => {

                setStudentId("");

                setDate("");

                window.location.reload();

            }}
            >
            Reset
        </button>

        <button
            onClick={downloadCSV}
            >
            Download CSV
        </button>

    </div>
    <div className="table-container">

      <table>

        <thead>

          <tr>

            <th>Student ID</th>

            <th>Name</th>

            <th>Date</th>

            <th>Time</th>

          </tr>

        </thead>

        <tbody>

          {records.map((record, index) => (

            <tr key={index}>

              <td>
                {record.student_id}
              </td>

              <td>
                {record.name}
              </td>

              <td>
                {record.date}
              </td>

              <td>
                {record.time}
              </td>

            </tr>

          ))}

        </tbody>

      </table>
      </div>

    </div>

  );

}

export default Attendance;