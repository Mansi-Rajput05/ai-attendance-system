"use client";

import { Download, Loader2, RotateCcw, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  attendanceDownloadUrl,
  clearAttendanceLogs,
  deleteAttendanceLog,
  getAttendance,
  type AttendanceRecord,
} from "@/lib/recognition-api";

export function AttendanceClient() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  async function fetchAttendance(filters = { studentId, date }) {
    setLoading(true);
    setError("");

    try {
      setRecords(await getAttendance(filters));
      toast.success("Attendance records loaded.");
    } catch {
      setError("Attendance records could not be loaded. Check the recognition API deployment.");
      toast.error("Attendance records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setStudentId("");
    setDate("");
    void fetchAttendance({ studentId: "", date: "" });
  }

  async function removeLog(record: AttendanceRecord) {
    if (!record.id) {
      toast.error("This log cannot be deleted because it has no record ID.");
      return;
    }

    const confirmed = window.confirm(`Delete attendance log for ${record.name} on ${record.date} at ${record.time}?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(record.id);

    try {
      await deleteAttendanceLog(record.id);
      toast.success("Attendance log deleted.");
      await fetchAttendance();
    } catch {
      toast.error("Attendance log delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  async function clearLogs() {
    const scope = studentId || date ? "the current filtered logs" : "all attendance logs";
    const confirmed = window.confirm(`Clear ${scope}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setClearing(true);

    try {
      const result = await clearAttendanceLogs({ studentId, date });
      toast.success(`${result.count} attendance log${result.count === 1 ? "" : "s"} cleared.`);
      await fetchAttendance();
    } catch {
      toast.error("Attendance logs could not be cleared.");
    } finally {
      setClearing(false);
    }
  }

  useEffect(() => {
    void fetchAttendance({ studentId: "", date: "" });
  }, []);

  return (
    <div>
      <PageHeader
        description="Search attendance by student or date, review records in a responsive table, and download the backend CSV export."
        eyebrow="Attendance ledger"
        title="Attendance records"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search attendance</CardTitle>
          <CardDescription>Filters are sent to the FastAPI backend and cached briefly through Redis when available.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="attendance-student-id">Student ID</Label>
              <Input
                id="attendance-student-id"
                inputMode="numeric"
                placeholder="Search by ID"
                type="number"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance-date">Date</Label>
              <Input id="attendance-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={loading} onClick={() => void fetchAttendance()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
              <Button disabled={loading} onClick={resetFilters} variant="outline">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={() => {
                  window.open(attendanceDownloadUrl(), "_blank");
                  toast.success("Attendance CSV export opened.");
                }}
                variant="secondary"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button disabled={loading || clearing || records.length === 0} onClick={() => void clearLogs()} variant="destructive">
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Clear Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>{records.length} attendance entries found.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell className="text-slate-500 dark:text-slate-500" colSpan={5}>
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : records.length > 0 ? (
                records.map((record, index) => (
                  <TableRow key={`${record.student_id}-${record.date}-${record.time}-${index}`}>
                    <TableCell className="font-medium">{record.student_id}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={!record.id || deletingId === record.id}
                        onClick={() => void removeLog(record)}
                        size="sm"
                        variant="destructive"
                      >
                        {deletingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="text-slate-500 dark:text-slate-500" colSpan={5}>
                    No attendance records match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
