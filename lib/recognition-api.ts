export type Student = {
  student_id: number;
  name: string;
};

export type AttendanceRecord = {
  id?: string;
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
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Recognition API failed with ${response.status}`;

    try {
      const payload = await response.json();
      message = payload?.message || payload?.error || payload?.detail || message;
    } catch {
      // Keep the status-based fallback when the backend does not return JSON.
    }

    throw new Error(Array.isArray(message) ? JSON.stringify(message) : String(message));
  }

  return response.json() as Promise<T>;
}

export function getDashboardStats() {
  return apiRequest<DashboardStats>("/api/dashboard-stats");
}

export function recognizeFrames(frames: string[]) {
  return apiRequest<RecognitionResponse>("/api/recognize", {
    method: "POST",
    body: JSON.stringify({ frames }),
  });
}

export function registerStudent(studentId: number, name: string, frames: string[]) {
  return apiRequest<RegisterResponse>("/api/students", {
    method: "POST",
    body: JSON.stringify({ studentId, name, frames }),
  });
}

export function getStudents() {
  return apiRequest<Student[]>("/api/students");
}

export function updateStudent(studentId: number, name: string) {
  return apiRequest<{ status: string }>(`/api/students/${studentId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function deleteStudent(studentId: number) {
  return apiRequest<{ status: string }>(`/api/students/${studentId}`, {
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

  return apiRequest<AttendanceRecord[]>(`/api/attendance${query ? `?${query}` : ""}`);
}

export function deleteAttendanceLog(id: string) {
  return apiRequest<{ status: string }>(`/api/attendance?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function clearAttendanceLogs(filters: { studentId?: string; date?: string }) {
  const params = new URLSearchParams();

  if (filters.studentId) {
    params.set("student_id", filters.studentId);
  }

  if (filters.date) {
    params.set("date", filters.date);
  }

  const query = params.toString();

  return apiRequest<{ status: string; count: number }>(`/api/attendance${query ? `?${query}` : ""}`, {
    method: "DELETE",
  });
}

export function attendanceDownloadUrl() {
  return "/api/attendance/export";
}
