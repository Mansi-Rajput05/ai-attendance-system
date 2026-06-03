export type Student = {
  student_id: number;
  name: string;
};

export type AttendanceRecord = {
  student_id: number;
  name: string;
  date: string;
  time: string;
};

export type DashboardStats = {
  total_students: number;
  today_attendance: number;
};

export type RecognitionResponse = {
  status: string;
  name?: string;
  student_id?: number | string;
  attendance_status?: string;
};

export type RegisterResponse = {
  status: string;
  student_id?: number;
  name?: string;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/recognition${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Recognition API failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getDashboardStats() {
  return apiRequest<DashboardStats>("/dashboard-stats");
}

export function recognizeFrames(frames: string[]) {
  return apiRequest<RecognitionResponse>("/recognize", {
    method: "POST",
    body: JSON.stringify({ frames }),
  });
}

export function registerStudent(studentId: number, name: string, frames: string[]) {
  return apiRequest<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId, name, frames }),
  });
}

export function getStudents() {
  return apiRequest<Student[]>("/students");
}

export function updateStudent(studentId: number, name: string) {
  return apiRequest<{ status: string }>(`/students/${studentId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function deleteStudent(studentId: number) {
  return apiRequest<{ status: string }>(`/students/${studentId}`, {
    method: "DELETE",
  });
}

export function getAttendance(filters: { studentId?: string; date?: string }) {
  const params = new URLSearchParams();

  if (filters.studentId) {
    params.set("student_id", filters.studentId);
  }

  if (filters.date) {
    params.set("date", filters.date);
  }

  const query = params.toString();

  return apiRequest<AttendanceRecord[]>(`/attendance${query ? `?${query}` : ""}`);
}

export function attendanceDownloadUrl() {
  return "/api/recognition/download-attendance";
}
