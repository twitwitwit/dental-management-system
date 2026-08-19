import { useEffect, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useCurrentRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import { CONDITION_COLORS, ToothChart } from "@/components/ToothChart";
import {
  SurfaceKey,
  ToothSurfaceChart,
  type SurfaceMap,
} from "@/components/ToothSurfaceChart";
import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from "@/components/dental";
import {
  ArrowLeft,
  CalendarPlus,
  ClipboardPlus,
  FileText,
  Loader2,
  Pencil,
  Plus,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";

const TOOTH_CONDITIONS = [
  "healthy", "decay", "filling", "crown", "extraction",
  "implant", "root_canal", "missing", "veneers", "bridge",
];

export default function PatientDetail({ id }: { id: number }) {
  const utils = trpc.useUtils();
  const role = useCurrentRole();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [toothDialogOpen, setToothDialogOpen] = useState(false);
  const [toothCondition, setToothCondition] = useState("");
  const [toothNote, setToothNote] = useState("");
  const [activeSurface, setActiveSurface] = useState<SurfaceKey | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const patient = trpc.patients.get.useQuery({ id }, { enabled: !!role && !!id });
  const conditions = trpc.clinical.toothConditions.useQuery(
    { patientId: id },
    { enabled: !!role },
  );
  const isDentist = role === "admin" || role === "dentist";
  const surfaces = trpc.clinical.surfaces.useQuery(
    { patientId: id },
    { enabled: !!role && isDentist },
  );
  const plans = trpc.clinical.plans.useQuery(
    { patientId: id },
    { enabled: !!role },
  );
  const notes = trpc.clinical.notes.useQuery(
    { patientId: id },
    { enabled: !!role },
  );
  const insurances = trpc.insurance.patientInsurance.useQuery(
    { patientId: id },
    { enabled: !!role },
  );

  const setTooth = trpc.clinical.setToothCondition.useMutation({
    onSuccess: () => {
      toast.success("Tooth condition saved");
      setToothDialogOpen(false);
      utils.clinical.toothConditions.invalidate({ patientId: id });
    },
    onError: e => toast.error(e.message),
  });

  const setSurface = trpc.clinical.setSurface.useMutation({
    onSuccess: () => {
      toast.success("Surface updated");
      utils.clinical.surfaces.invalidate({ patientId: id });
    },
    onError: e => toast.error(e.message),
  });

  const addPlan = trpc.clinical.createPlan.useMutation({
    onSuccess: () => {
      toast.success("Treatment plan created");
      utils.clinical.plans.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const addNote = trpc.clinical.addNote.useMutation({
    onSuccess: () => {
      toast.success("Clinical note added");
      setNoteDialogOpen(false);
      setNoteTitle("");
      setNoteContent("");
      utils.clinical.notes.invalidate({ patientId: id });
    },
    onError: e => toast.error(e.message),
  });

  useEffect(() => {
    document.title = patient.data
      ? `${patient.data.firstName} ${patient.data.lastName} — Dentacare`
      : "Patient — Dentacare";
  }, [patient.data]);

  if (patient.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const p = patient.data;
  if (!p) {
    return (
      <DashboardLayout>
        <div className="py-16">
          <EmptyState title="Patient not found" description="This patient record could not be located." />
        </div>
      </DashboardLayout>
    );
  }

  const condMap = (conditions.data ?? []).reduce(
    (acc, c) => ({ ...acc, [c.toothNumber]: c.condition }),
    {} as Record<string, string>,
  );

  const surfaceMap = (surfaces.data ?? []).reduce(
    (acc, s) => ({
      ...acc,
      [s.toothNumber]: { ...(acc[s.toothNumber] ?? {}), [s.surface]: s.condition },
    }),
    {} as SurfaceMap,
  );

  return (
    <DashboardLayout>
      <div className="mb-5">
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> All patients
        </Link>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 shadow-[0_2px_12px_-4px_rgba(13,60,67,0.08)] p-5 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
            {(p.firstName[0] + p.lastName[0]).toUpperCase()}
          </div>
          <div className="flex-1 min-w-56">
            <h1 className="text-lg font-bold tracking-tight">
              {p.firstName} {p.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {p.gender ? `${p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}, ` : ""}
              DOB {formatDate(p.dateOfBirth)} · ID #{p.id}
            </p>
          </div>
          <StatusBadge status={p.status} />
          <div className="flex gap-2">
            {role === "admin" || role === "receptionist" ? (
              <Button variant="outline" className="gap-1.5" onClick={() => window.location.href = "/appointments"}>
                <CalendarPlus className="h-4 w-4" /> Appointment
              </Button>
            ) : null}
            {role === "admin" || role === "dentist" || role === "receptionist" ? (
              <Button variant="outline" className="gap-1.5" onClick={() => window.location.href = "/billing"}>
                <FileText className="h-4 w-4" /> Invoice
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-x-8 gap-y-2 mt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Phone" value={p.phone} />
          <Info label="Email" value={p.email} />
          <Info label="Blood type" value={p.bloodType} />
          <Info label="Allergies" value={p.allergies} />
          <Info label="Registered" value={formatDate(p.registeredAt)} className="sm:col-span-2 lg:col-span-4" />
          {p.medicalNotes ? <Info label="Medical history" value={p.medicalNotes} className="sm:col-span-2 lg:col-span-4" /> : null}
          {p.dentalNotes ? <Info label="Dental history" value={p.dentalNotes} className="sm:col-span-2 lg:col-span-4" /> : null}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinical" disabled={!isDentist}>Clinical</TabsTrigger>
          <TabsTrigger value="notes" disabled={!isDentist}>Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Dental chart">
            <ToothChart
              conditions={condMap}
              selected={selectedTooth}
              onSelect={n => {
                setSelectedTooth(n);
                setActiveSurface(null);
                if (isDentist) setToothDialogOpen(true);
              }}
              size={40}
              gap={3}
            />
            <p className="mt-4 text-xs text-muted-foreground text-center">
              Click a tooth to record its condition.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {Object.entries(CONDITION_COLORS).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v }} />
                  {k.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6">
            <SectionCard
              title="Treatment plans"
              actions={
                isDentist ? (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => addPlan.mutate({ patientId: id, title: "New Treatment Plan", diagnosis: null, estimatedCost: 0 })}>
                    <Plus className="h-3.5 w-3.5" /> New plan
                  </Button>
                ) : undefined
              }
            >
              {!plans.data?.length ? (
                <EmptyState title="No treatment plans yet" description="Plans will appear here once created." />
              ) : (
                <ul className="divide-y divide-border/70">
                  {plans.data.map(plan => (
                    <li key={plan.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{plan.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{plan.diagnosis || "No diagnosis"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            ${Number(plan.estimatedCost).toLocaleString()}
                          </p>
                          <StatusBadge status={plan.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Insurance coverage">
              {!insurances.data?.length ? (
                <EmptyState
                  title="No insurance on file"
                  description="Add insurance details from the Insurance module."
                />
              ) : (
                <ul className="divide-y divide-border/70">
                  {insurances.data.map(pi => (
                    <li key={pi.id} className="py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span className="font-medium">Policy {pi.policyNumber}</span>
                      <StatusBadge status={pi.isActive ? "active" : "inactive"} />
                      <span className="text-muted-foreground text-xs">
                        Co-pay ${Number(pi.coPay).toFixed(0)} · Deductible ${Number(pi.deductible).toFixed(0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="clinical">
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Dental chart — whole tooth">
              <ToothChart conditions={condMap} size={40} gap={3} />
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Click a tooth to record its whole-tooth condition.
              </p>
            </SectionCard>
            <SectionCard title="Surface chart — 5 surfaces per tooth">
              <ToothSurfaceChart
                surfaces={surfaceMap}
                selectedTooth={selectedTooth}
                activeSurface={activeSurface}
                onSelect={(toothNumber, surface) => {
                  setSelectedTooth(toothNumber);
                  setActiveSurface(surface);
                  setToothDialogOpen(true);
                }}
              />
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Click a surface (mesial · distal · buccal · lingual · occlusal) to record decay or fillings per surface.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {[["decay", CONDITION_COLORS.decay], ["filling", CONDITION_COLORS.filling], ["missing", CONDITION_COLORS.missing]].map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: v }} />
                    {k}
                  </span>
                ))}
                <span className="text-[11px] text-muted-foreground">· white = healthy</span>
              </div>
            </SectionCard>
            <SectionCard
              title="Treatment plans"
              actions={
                isDentist ? (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => addPlan.mutate({ patientId: id, title: "New Treatment Plan", diagnosis: null, estimatedCost: 0 })}>
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
                    <li key={plan.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{plan.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{plan.diagnosis || "No diagnosis"}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">${Number(plan.estimatedCost).toLocaleString()}</p>
                          <StatusBadge status={plan.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <SectionCard
            title="Clinical notes"
            actions={
              isDentist ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setNoteDialogOpen(true)}>
                  <ScrollText className="h-4 w-4" /> Add note
                </Button>
              ) : undefined
            }
          >
            {!notes.data?.length ? (
              <EmptyState title="No clinical notes yet" description="Notes recorded after visits will appear here." />
            ) : (
              <ul className="divide-y divide-border/70">
                {notes.data.map(n => (
                  <li key={n.id} className="py-3.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold">{n.title || "Note"}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(n.noteDate)}</span>
                    </div>
                    {n.content ? <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Tooth / surface condition dialog */}
      <Dialog
        open={toothDialogOpen}
        onOpenChange={open => {
          setToothDialogOpen(open);
          if (!open) {
            setActiveSurface(null);
            setToothCondition("");
            setToothNote("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Tooth {selectedTooth}
              {activeSurface ? ` — ${activeSurface} surface` : " — record condition"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3.5"
            onSubmit={e => {
              e.preventDefault();
              if (!selectedTooth) return;
              if (activeSurface) {
                setSurface.mutate({
                  patientId: id,
                  toothNumber: selectedTooth,
                  surface: activeSurface,
                  condition: (toothCondition || "healthy") as "healthy",
                  note: toothNote || null,
                });
                setToothDialogOpen(false);
              } else {
                setTooth.mutate({
                  patientId: id,
                  toothNumber: selectedTooth,
                  condition: (toothCondition || "healthy") as "healthy",
                  note: toothNote || null,
                });
              }
            }}
          >
            {activeSurface ? (
              <p className="text-xs text-muted-foreground">
                Marking the <span className="font-medium text-foreground">{activeSurface}</span> surface of tooth {selectedTooth}.
                Choose <span className="font-medium">decay</span>, <span className="font-medium">filling</span>, or
                <span className="font-medium"> healthy</span> (to clear).
              </p>
            ) : null}
            <div className="grid gap-1.5">
              <Label>{activeSurface ? "Surface condition" : "Condition"}</Label>
              <Select value={toothCondition} onValueChange={setToothCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {(activeSurface
                    ? ["healthy", "decay", "filling", "missing"]
                    : TOOTH_CONDITIONS
                  ).map(c => (
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
            <Button type="submit" disabled={setTooth.isPending || setSurface.isPending} className="gap-1.5">
              {setTooth.isPending || setSurface.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPlus className="h-4 w-4" />}
              Save condition
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clinical note dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add clinical note</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3.5"
            onSubmit={e => {
              e.preventDefault();
              addNote.mutate({
                patientId: id,
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
              <Input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="e.g. Post-extraction check" />
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

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">
        {value || "—"}
      </p>
    </div>
  );
}
