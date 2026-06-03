"use client";

import { Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteStudent, getStudents, updateStudent, type Student } from "@/lib/recognition-api";

export function StudentsClient() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateStudent(studentId, editingName.trim());
      setEditingId(null);
      setEditingName("");
      await fetchStudents();
    } catch {
      setError("Student update failed.");
      setLoading(false);
    }
  }

  async function confirmDelete(studentId: number) {
    setLoading(true);
    setError("");

    try {
      await deleteStudent(studentId);
      setDeletingId(null);
      await fetchStudents();
    } catch {
      setError("Student delete failed.");
      setLoading(false);
    }
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

      <Card className="glass-panel border-primary/20">
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                id="student-search"
                placeholder="Search by ID or name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

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
                  <TableCell className="text-muted-foreground" colSpan={3}>
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
                          <Button size="sm" variant="destructive" onClick={() => void confirmDelete(student.student_id)}>
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
                          <Button size="sm" variant="outline" onClick={() => startEdit(student)}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeletingId(student.student_id)}>
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
                  <TableCell className="text-muted-foreground" colSpan={3}>
                    No students match the current search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Syncing recognition data...
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
