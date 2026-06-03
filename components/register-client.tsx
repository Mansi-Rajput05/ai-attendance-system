"use client";

import { Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CameraPanel } from "@/components/camera-panel";
import { ScanResultAlert } from "@/components/scan-result-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteStudent, getStudents, type Student } from "@/lib/recognition-api";

export function RegisterClient() {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const resultClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refreshStudents() {
    setIsLoadingStudents(true);

    try {
      setStudents(await getStudents());
      setStudentsError(null);
    } catch (error) {
      setStudentsError(error instanceof Error ? error.message : "Unable to load students.");
    } finally {
      setIsLoadingStudents(false);
    }
  }

  async function handleRegisterResult(nextResult: Record<string, unknown>) {
    setResult(nextResult);

    if (resultClearTimerRef.current) {
      clearTimeout(resultClearTimerRef.current);
    }

    resultClearTimerRef.current = setTimeout(() => {
      setResult(null);
      resultClearTimerRef.current = null;
    }, 3000);

    if (nextResult.status === "REGISTERED") {
      setStudentId("");
      setName("");
      await refreshStudents();
    }
  }

  async function removeStudent(student: Student) {
    const confirmed = window.confirm(`Delete ${student.name} and their recognition profile?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(student.student_id);

    try {
      await deleteStudent(student.student_id);
      await refreshStudents();
    } catch (error) {
      setStudentsError(error instanceof Error ? error.message : "Unable to delete student.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void refreshStudents();

    return () => {
      if (resultClearTimerRef.current) {
        clearTimeout(resultClearTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="h-fit">
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle>Register New Student</CardTitle>
            <CardDescription>
              Enter student details, turn on the camera, and capture a clear live face sample. The FastAPI service stores the
              embedding and refreshes the student list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Student ID
              <Input value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="e.g. 101" />
            </label>
            <label className="block space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Student Name
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Raj Sharma" />
            </label>
            <ScanResultAlert result={result} title="Registration Alert" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Face Capture</CardTitle>
            <CardDescription>Use a front-facing camera, avoid low light, and keep only one face visible.</CardDescription>
          </CardHeader>
          <CardContent>
            <CameraPanel mode="register" studentId={studentId} name={name} onResult={handleRegisterResult} />
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100">
              Please move your face left and right and than look center
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Registered Students</CardTitle>
                <CardDescription>Total registered students: {students.length}</CardDescription>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={refreshStudents} disabled={isLoadingStudents}>
            {isLoadingStudents ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {studentsError ? (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              {studentsError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-bold">Student ID</th>
                    <th className="px-5 py-4 font-bold">Name</th>
                    <th className="px-5 py-4 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {students.map((student) => (
                    <tr key={student.student_id} className="text-slate-700 dark:text-slate-300">
                      <td className="px-5 py-4 font-semibold text-slate-950 dark:text-slate-100">{student.student_id}</td>
                      <td className="px-5 py-4">{student.name}</td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          className="h-9 gap-2 px-3"
                          variant="destructive"
                          onClick={() => void removeStudent(student)}
                          disabled={deletingId === student.student_id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === student.student_id ? "Deleting" : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isLoadingStudents && students.length === 0 ? (
              <div className="border-t border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
                No registered students yet. Register the first student using the camera above.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
