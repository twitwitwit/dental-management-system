import { useMemo, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useCurrentRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import { ToothChart } from "@/components/ToothChart";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/dental";
import {
  ClipboardPlus,
  FileText,
  Loader2,
  Pencil,
  Plus,
  ScrollText,
  UserRound,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const TOOTH_CONDITIONS = [
  "healthy", "decay", "filling", "crown", "extraction",
  "implant", "root_canal", "missing", "veneers", "bridge",
];

export default function Clinical() {
  const utils = trpc.useUtils();
  const role = useCurrentRole();
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const patients = trpc.patients.list.useQuery(
    { search: search || undefined },
    { enabled: !!role },
  );

  const conditions = trpc.clinical.toothConditions.useQuery(
    { patientId: selectedPatientId ?? 0 },
    { enabled: !!role && !!selectedPatientId },
  );
  const plans = trpc.clinical.plans.useQuery(
    { patientId: selectedPatientId ?? 0 },
    { enabled: !!role && !!selectedPatientId },
  );
  const notes = trpc.clinical.notes.useQuery(
    { patientId: selectedPatientId ?? 0 },
    { enabled: !!role && !!selectedPatientId },
  );

  const [toothDialog, setToothDialog] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [toothCondition, setToothCondition] = useState("");
  const [toothNote, setToothNote] = useState("");

  const [planDialog, setPlanDialog] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planDiagnosis, setPlanDiagnosis] = useState("");
  const [planCost, setPlanCost] = useState("");

  const [noteDialog, setNoteDialog] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const setTooth = trpc.clinical.setToothCondition.useMutation({
    onSuccess: () => {
      toast.success("Tooth condition saved");
      setToothDialog(false);
      utils.clinical.toothConditions.invalidate({ patientId: selectedPatientId ?? undefined });
    },
    onError: e => toast.error(e.message),
  });

  const addPlan = trpc.clinical.createPlan.useMutation({
    onSuccess: () => {
      toast.success("Treatment plan created");
      setPlanDialog(false);
      setPlanTitle("");
      setPlanDiagnosis("");
      setPlanCost("");
      utils.clinical.plans.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const updatePlan = trpc.clinical.updatePlan.useMutation({
    onSuccess: () => {
      toast.success("Plan updated");
      utils.clinical.plans.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const addNote = trpc.clinical.addNote.useMutation({
    onSuccess: () => {
      toast.success("Clinical note added");
      setNoteDialog(false);
      setNoteTitle("");
      setNoteContent("");
      utils.clinical.notes.invalidate({ patientId: selectedPatientId ?? undefined });
    },
    onError: e => toast.error(e.message),
  });

  const canManage = role === "admin" || role === "dentist";

  const selectedPatient = useMemo(
    () => (patients.data ?? []).find(p => p.id === selectedPatientId) ?? null,
    [patients.data, selectedPatientId],
  );

  const condMap = useMemo(() => {
    const map: Record<string, string> = {};
    (conditions.data ?? []).forEach(c => {
      map[c.toothNumber] = c.condition;
    });
    return map;
  }, [conditions.data]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Clinical Records"
        description="Dental charts, treatment plans, and clinical notes. Dental assistant, dentist, and admin access."
      />

      <div className="grid gap-4 mb-6 xl:grid-cols-[280px_1fr]">
        <SectionCard title="Patients">
          <div className="relative mb-3">
            <Input
              placeholder="Search patients…"
              className="bg-background h-8 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {patients.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !patients.data?.length ? (
            <EmptyState
              title="No patients"
              description="Add patients in the Patients module first."
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link href="/patients">Patients</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-1.5">
              {patients.data.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedPatientId === p.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-accent/60"
                    }`}
                  >
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {(p.firstName[0] + p.lastName[0]).toUpperCase()}
                    </span>
                    <span className="truncate">
                      {p.firstName} {p.lastName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {selectedPatient ? (
          <div className="grid gap-6">
            <SectionCard
              title={`Dental chart — ${selectedPatient.firstName} ${selectedPatient.lastName}`}
              actions={
                <Button size="sm" variant="outline" asChild className="gap-1.5">
                  <Link href={`/patients/${selectedPatient.id}`}>
                    <FileText className="h-4 w-4" /> Profile
                  </Link>
                </Button>
              }
            >
              <ToothChart
                conditions={condMap}
                selected={selectedTooth}
                onSelect={n => {
                  setSelectedTooth(n);
                  if (canManage) setToothDialog(true);
                }}
              />
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Click a tooth to record its condition (dentist/admin only).
              </p>
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard
                title="Treatment plans"
                actions={
                  canManage ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPlanDialog(true)}>
                      <Plus className="h-3.5 w-3.5" /> New plan
                    </Button>
                  ) : undefined
                }
              >
                {!plans.data?.length ? (
                  <EmptyState title="No treatment plans yet" />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {plans.data.map(plan => (
                      <li key={plan.id} className="py-3.5">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{plan.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {plan.diagnosis || "No diagnosis"} · {formatDate(plan.createdAt)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">${Number(plan.estimatedCost).toLocaleString()}</p>
                            <StatusBadge status={plan.status} />
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-2">
                            <Select
                              value={plan.status}
                              onValueChange={v =>
                                updatePlan.mutate({ id: plan.id, data: { status: v as "planned" } })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs bg-background w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="planned">Planned</SelectItem>
                                <SelectItem value="in_progress">In progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Clinical notes"
                actions={
                  canManage ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setNoteDialog(true)}>
                      <ScrollText className="h-4 w-4" /> Add note
                    </Button>
                  ) : undefined
                }
              >
                {!notes.data?.length ? (
                  <EmptyState title="No clinical notes yet" />
                ) : (
                  <ul className="divide-y divide-border/70">
                    {notes.data.map(n => (
                      <li key={n.id} className="py-3.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold">{n.title || "Note"}</p>
                          <span className="text-xs text-muted-foreground">{formatDate(n.noteDate)}</span>
                        </div>
                        {n.content ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        ) : (
          <SectionCard title="Select a patient">
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <UserRound className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-2">
                Choose a patient from the list to view their dental chart, treatment plans, and notes.
              </p>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Tooth condition dialog */}
      <Dialog open={toothDialog} onOpenChange={setToothDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tooth {selectedTooth} — record condition</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3.5"
            onSubmit={e => {
              e.preventDefault();
              if (!selectedTooth || !selectedPatientId) return;
              setTooth.mutate({
                patientId: selectedPatientId,
                toothNumber: selectedTooth,
                condition: (toothCondition || "healthy") as "healthy",
                note: toothNote || null,
              });
            }}
          >
            <div className="grid gap-1.5">
              <Label>Condition</Label>
              <Select value={toothCondition} onValueChange={setToothCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {TOOTH_CONDITIONS.map(c => (
                    <SelectItem key={c} value={c}>
                      {c.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Comment (optional)</Label>
              <Input value={toothNote} onChange={e => setToothNote(e.target.value)} />
            </div>
            <Button type="submit" disabled={setTooth.isPending} className="gap-1.5">
              {setTooth.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPlus className="h-4 w-4" />}
              Save condition
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Treatment plan dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New treatment plan</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3.5"
            onSubmit={e => {
              e.preventDefault();
              if (!selectedPatientId) return;
              addPlan.mutate({
                patientId: selectedPatientId,
                title: planTitle.trim(),
                diagnosis: planDiagnosis || null,
                estimatedCost: Number(planCost) || 0,
              });
            }}
          >
            <div className="grid gap-1.5">
              <Label>Title *</Label>
              <Input required value={planTitle} onChange={e => setPlanTitle(e.target.value)} placeholder="e.g. Lower molar restoration" />
            </div>
            <div className="grid gap-1.5">
              <Label>Diagnosis</Label>
              <Textarea rows={2} value={planDiagnosis} onChange={e => setPlanDiagnosis(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Estimated cost ($)</Label>
              <Input type="number" min="0" value={planCost} onChange={e => setPlanCost(e.target.value)} placeholder="0" />
            </div>
            <Button type="submit" disabled={addPlan.isPending || !planTitle.trim()} className="gap-1.5">
              {addPlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Create plan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clinical note dialog */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add clinical note</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3.5"
            onSubmit={e => {
              e.preventDefault();
              if (!selectedPatientId) return;
              addNote.mutate({
                patientId: selectedPatientId,
                appointmentId: null,
                dentistName: role === "dentist" ? "Attending Dentist" : null,
                title: noteTitle || null,
                content: noteContent || null,
                noteDate: new Date().toISOString().slice(0, 10),
              });
            }}
          >
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="e.g. Post-treatment check" />
            </div>
            <div className="grid gap-1.5">
              <Label>Content</Label>
              <Textarea rows={5} value={noteContent} onChange={e => setNoteContent(e.target.value)} />
            </div>
            <Button type="submit" disabled={addNote.isPending} className="gap-1.5">
              {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Save note
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
