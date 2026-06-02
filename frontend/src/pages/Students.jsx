import { useEffect, useState } from "react";

function Students() {

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {

    fetchStudents();

  }, []);

  async function fetchStudents() {

    const response = await fetch(
      "http://127.0.0.1:8000/students"
    );

    const data = await response.json();

    setStudents(data);

  }

  async function deleteStudent(studentId, studentName) {

  const confirmed = window.confirm(
    `Are you sure you want to delete ${studentName}?`
  );

  if (!confirmed) {
    return;
  }

  const response = await fetch(
    `http://127.0.0.1:8000/students/${studentId}`,
    {
      method: "DELETE"
    }
  );

  const data = await response.json();

  console.log(data);

  fetchStudents();

}

    const filteredStudents = students.filter(
        (student) =>
            student.name
            .toLowerCase()
            .includes(search.toLowerCase()) ||

            student.student_id
            .toString()
            .includes(search)
    );


    async function editStudent(
        studentId,
        currentName
        ) {

        const newName =
            window.prompt(
            "Enter new name:",
            currentName
            );

        if (
            !newName ||
            newName.trim() === ""
        ) {
            return;
        }

        const response = await fetch(
            `http://127.0.0.1:8000/students/${studentId}`,
            {
            method: "PUT",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
                name: newName
            })
            }
        );

        const data =
            await response.json();

        console.log(data);

        fetchStudents();

    }

  return (

    <div>

      <h1>Students</h1>
      <p className="student-count">
        Total Students: {students.length}
    </p>
      <input
        type="text"
        placeholder="Search by ID or Name"
        value={search}
        onChange={(e) =>
            setSearch(e.target.value)
        }
    />
    <div className="table-container">
      <table>

        <thead>

            <tr>

            <th>Student ID</th>

            <th>Name</th>

            <th>Action</th>

            </tr>

        </thead>

        <tbody>

            {filteredStudents.map((student) => (

            <tr key={student.student_id}>

                <td>
                    {student.student_id}
                </td>

                <td>
                    {student.name}
                </td>

                <td>
                    <div className="action-buttons">

                    <button
                        onClick={() =>
                            editStudent(
                            student.student_id,
                            student.name
                            )
                        }
                        >
                        Edit
                    </button>

                    <button className="delete-btn"
                    onClick={() =>
                        deleteStudent(
                        student.student_id,
                        student.name
                        )
                    }
                    >
                    Delete
                    </button>
                    </div>
                </td>

            </tr>

            ))}

        </tbody>

    </table>
    </div>

    </div>

  );

}

export default Students;