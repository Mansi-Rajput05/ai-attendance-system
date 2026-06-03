"use client";

import { BarChart3, Download, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis } from "recharts";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteStudent, getAttendance, getStudents, updateStudent, type AttendanceRecord, type Student } from "@/lib/recognition-api";

const chartConfig = {
  count: {
    label: "Attendance",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export function StudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentLogs, setStudentLogs] = useState<AttendanceRecord[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return students;
    }

    return students.filter(
      (student) => student.name.toLowerCase().includes(query) || student.student_id.toString().includes(query),
    );
  }, [search, students]);

  async function fetchStudents() {
    setLoading(true);
    setError("");

    try {
      setStudents(await getStudents());
    } catch {
      setError("Students could not be loaded. Check the recognition API deployment.");
      toast.error("Students could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(student: Student) {
    setEditingId(student.student_id);
    setEditingName(student.name);
  }

  async function saveEdit(studentId: number) {
    if (!editingName.trim()) {
      setError("Student name cannot be empty.");
      toast.error("Student name cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateStudent(studentId, editingName.trim());
      setEditingId(null);
      setEditingName("");
      toast.success("Student updated successfully.");
      await fetchStudents();
    } catch {
      setError("Student update failed.");
      toast.error("Student update failed.");
      setLoading(false);
    }
  }

  async function confirmDelete(studentId: number) {
    setLoading(true);
    setError("");

    try {
      await deleteStudent(studentId);
      setDeletingId(null);
      if (selectedStudent?.student_id === studentId) {
        setSelectedStudent(null);
        setStudentLogs([]);
      }
      toast.success("Student deleted successfully.");
      await fetchStudents();
    } catch {
      setError("Student delete failed.");
      toast.error("Student delete failed.");
      setLoading(false);
    }
  }

  async function viewLogs(student: Student) {
    setSelectedStudent(student);
    setLogsLoading(true);
    setLogsError("");

    try {
      const records = (await getAttendance({ studentId: String(student.student_id) })).sort((first, second) =>
        `${second.date} ${second.time}`.localeCompare(`${first.date} ${first.time}`),
      );
      setStudentLogs(records);
      toast.success(`Loaded attendance logs for ${student.name}.`);
    } catch {
      setLogsError("Attendance logs could not be loaded.");
      setStudentLogs([]);
      toast.error("Attendance logs could not be loaded.");
    } finally {
      setLogsLoading(false);
    }
  }

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();

    for (const log of studentLogs) {
      counts.set(log.date, (counts.get(log.date) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, count]) => ({ date, count }));
  }, [studentLogs]);

  function exportSelectedLogsCsv() {
    if (!selectedStudent || studentLogs.length === 0) {
      toast.warning("No attendance logs available to export.");
      return;
    }

    const rows = [
      ["Student ID", "Name", "Date", "Time"],
      ...studentLogs.map((log) => [String(log.student_id), log.name, log.date, log.time]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedStudent.student_id}-attendance.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance CSV exported.");
  }

  useEffect(() => {
    void fetchStudents();
  }, []);

  return (
    <div>
      <PageHeader
        description="Manage registered students without leaving the App Router interface. Edits sync back to the FastAPI recognition store."
        eyebrow="Student directory"
        title="Registered students"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>Search, rename, or remove recognition profiles.</CardDescription>
            </div>
            <Badge className="w-fit" variant="secondary">
              {students.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="student-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                id="student-search"
                placeholder="Search by ID or name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">{error}</p> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="text-slate-500 dark:text-slate-500" colSpan={3}>
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">{student.student_id}</TableCell>
                    <TableCell>
                      {editingId === student.student_id ? (
                        <Input value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                      ) : (
                        student.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {deletingId === student.student_id ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="danger" onClick={() => void confirmDelete(student.student_id)}>
                            Confirm delete
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      ) : editingId === student.student_id ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" onClick={() => void saveEdit(student.student_id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => void viewLogs(student)}>
                            <BarChart3 className="h-4 w-4" />
                            Logs
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEdit(student)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setDeletingId(student.student_id)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-slate-500 dark:text-slate-500" colSpan={3}>
                    No students match the current search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing recognition data...
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedStudent ? (
        <Card className="mt-6">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>{selectedStudent.name} Attendance Logs</CardTitle>
              <CardDescription>
                Student ID {selectedStudent.student_id}. Review records, chart attendance by date, and export CSV.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void viewLogs(selectedStudent)} disabled={logsLoading}>
                {logsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Refresh Logs
              </Button>
              <Button variant="secondary" onClick={exportSelectedLogsCsv} disabled={studentLogs.length === 0}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="ghost" onClick={() => setSelectedStudent(null)}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {logsError ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
                {logsError}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">Total Logs</p>
                <p className="mt-2 text-3xl font-black text-slate-950 dark:text-slate-100">{studentLogs.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">Active Dates</p>
                <p className="mt-2 text-3xl font-black text-slate-950 dark:text-slate-100">{chartData.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">Latest Log</p>
                <p className="mt-2 text-lg font-black text-slate-950 dark:text-slate-100">
                  {studentLogs[0] ? `${studentLogs[0].date} ${studentLogs[0].time}` : "No logs"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={chartData} margin={{ left: 12, right: 12, top: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell className="text-slate-500 dark:text-slate-500" colSpan={3}>
                      Loading attendance logs...
                    </TableCell>
                  </TableRow>
                ) : studentLogs.length > 0 ? (
                  studentLogs.map((log, index) => (
                    <TableRow key={`${log.student_id}-${log.date}-${log.time}-${index}`}>
                      <TableCell className="font-medium">{log.date}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell>{log.name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-slate-500 dark:text-slate-500" colSpan={3}>
                      No attendance logs found for this student.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
