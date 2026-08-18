import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { formatDate, formatMoney } from "@/lib/format";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/dental";
import {
  Banknote,
  FileText,
  Loader2,
  MinusCircle,
  Plus,
  PlusCircle,
  ReceiptText,
} from "lucide-react";
import { toast } from "sonner";

type InvoiceItemRow = { description: string; quantity: number; unitPrice: number };

export default function Billing() {
  const utils = trpc.useUtils();
  const role = useCurrentRole();
  const [search, setSearch] = useState("");
  const [filterPatientId, setFilterPatientId] = useState<string>("all");

  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoicePatient, setInvoicePatient] = useState("");
  const [discount, setDiscount] = useState("");
  const [tax, setTax] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItemRow[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<number | null>(null);
  const [paymentPatientId, setPaymentPatientId] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "insurance">("cash");
  const [paymentType, setPaymentType] = useState<"payment" | "refund">("payment");

  const patients = trpc.patients.list.useQuery({}, { enabled: !!role });
  const invoices = trpc.billing.invoices.useQuery(
    { patientId: filterPatientId !== "all" ? Number(filterPatientId) : undefined },
    { enabled: !!role },
  );
  const payments = trpc.billing.payments.useQuery({}, { enabled: !!role });

  const balanceByInvoice = useMemo(() => {
    const map = new Map<number, { total: number; paid: number; balance: number }>();
    (invoices.data ?? []).forEach(inv => {
      const rows = (payments.data ?? []).filter(p => p.invoiceId === inv.id);
      const paid = rows.reduce(
        (acc, p) => acc + (p.type === "refund" ? -Number(p.amount) : Number(p.amount)),
        0,
      );
      map.set(inv.id, { total: Number(inv.total), paid, balance: Number(inv.total) - paid });
    });
    return map;
  }, [invoices.data, payments.data]);

  const canManage = role === "admin" || role === "dentist" || role === "receptionist";

  const createInvoice = trpc.billing.createInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice created");
      setInvoiceDialog(false);
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
      setDiscount("");
      setTax("");
      setDueDate("");
      utils.billing.invoices.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const updateStatus = trpc.billing.updateInvoiceStatus.useMutation({
    onSuccess: () => utils.billing.invoices.invalidate(),
    onError: e => toast.error(e.message),
  });

  const recordPayment = trpc.billing.recordPayment.useMutation({
    onSuccess: res => {
      toast.success(`Payment recorded. New balance: ${formatMoney(res.newBalance.balance)}`);
      setPaymentDialog(false);
      setPaymentAmount("");
      utils.billing.invoices.invalidate();
      utils.billing.payments.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const invoiceTotal = subtotal - Number(discount || 0) + Number(tax || 0);

  const patientById = useMemo(() => {
    const map = new Map<number, { firstName: string; lastName: string }>();
    (patients.data ?? []).forEach(p => map.set(p.id, p));
    return map;
  }, [patients.data]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Billing & Payments"
        description="Invoices, payments, and outstanding balances."
        actions={
          canManage ? (
            <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
              <Button className="gap-1.5" onClick={() => setInvoiceDialog(true)}>
                <ReceiptText className="h-4 w-4" /> New Invoice
              </Button>
              <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Generate Invoice</DialogTitle>
                </DialogHeader>
                <form
                  className="grid gap-4"
                  onSubmit={e => {
                    e.preventDefault();
                    const patientId = Number(invoicePatient);
                    const clean = items.filter(
                      it => it.description.trim() && it.quantity > 0 && it.unitPrice > 0,
                    );
                    if (!patientId || !clean.length) {
                      toast.error("Select a patient and add at least one line item");
                      return;
                    }
                    createInvoice.mutate({
                      patientId,
                      discount: Number(discount || 0),
                      tax: Number(tax || 0),
                      dueDate: dueDate || null,
                      items: clean,
                    });
                  }}
                >
                  <div className="grid gap-1.5">
                    <Label>Patient *</Label>
                    <Select value={invoicePatient} onValueChange={setInvoicePatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {(patients.data ?? []).map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.firstName} {p.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Line items *</Label>
                    {items.map((it, i) => (
                      <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2">
                        <Input
                          placeholder="Description (e.g. Dental cleaning)"
                          value={it.description}
                          onChange={e => {
                            const next = [...items];
                            next[i] = { ...it, description: e.target.value };
                            setItems(next);
                          }}
                        />
                        <Input
                          type="number"
                          min={1}
                          placeholder="Qty"
                          value={it.quantity || ""}
                          onChange={e => {
                            const next = [...items];
                            next[i] = { ...it, quantity: Number(e.target.value) || 0 };
                            setItems(next);
                          }}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Price"
                          value={it.unitPrice || ""}
                          onChange={e => {
                            const next = [...items];
                            next[i] = { ...it, unitPrice: Number(e.target.value) || 0 };
                            setItems(next);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-8 text-muted-foreground hover:text-destructive"
                          disabled={items.length === 1}
                          onClick={() => setItems(items.filter((_, j) => j !== i))}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
                      }
                    >
                      <Plus className="h-3.5 w-3.5" /> Add item
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Discount ($)</Label>
                      <Input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Tax ($)</Label>
                      <Input type="number" min={0} value={tax} onChange={e => setTax(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Due date</Label>
                      <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    Subtotal: {formatMoney(subtotal)} · Total:{" "}
                    {formatMoney(invoiceTotal)}
                  </p>
                  <Button type="submit" disabled={createInvoice.isPending} className="gap-1.5">
                    {createInvoice.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Generate invoice
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <SectionCard
        title="Invoices"
        actions={
          <Select value={filterPatientId} onValueChange={setFilterPatientId}>
            <SelectTrigger className="w-44 h-8 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All patients</SelectItem>
              {(patients.data ?? []).map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.firstName} {p.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {invoices.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !invoices.data?.length ? (
          <EmptyState title="No invoices yet" description="Create an invoice to bill a patient." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Invoice</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.data.map(inv => {
                const patient = patientById.get(inv.patientId);
                const balance = balanceByInvoice.get(inv.id);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium text-xs">
                      <span className="block">{inv.invoiceNumber}</span>
                      {inv.notes ? (
                        <span className="text-muted-foreground block max-w-48 truncate">{inv.notes}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {patient ? `${patient.firstName} ${patient.lastName}` : `#${inv.patientId}`}
                    </TableCell>
                    <TableCell>{formatDate(inv.createdAt)}</TableCell>
                    <TableCell>{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className="text-right">{formatMoney(inv.total)}</TableCell>
                    <TableCell className="text-right">
                      {balance ? formatMoney(balance.paid) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {balance ? formatMoney(balance.balance) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge status={inv.status} />
                        {canManage && (
                          <Select
                            value={inv.status}
                            onValueChange={v =>
                              updateStatus.mutate({ id: inv.id, status: v as "draft" })
                            }
                          >
                            <SelectTrigger className="h-7 w-28 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1"
                          disabled={balance && balance.balance <= 0}
                          onClick={() => {
                            setPaymentInvoiceId(inv.id);
                            setPaymentPatientId(inv.patientId);
                            setPaymentAmount(balance ? String(Math.min(Number(balance.balance), Number(inv.total))) : "0");
                            setPaymentType("payment");
                            setPaymentDialog(true);
                          }}
                        >
                          <Banknote className="h-3.5 w-3.5" /> Payment
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Payment history">
          {!payments.data?.length ? (
            <EmptyState title="No payments recorded yet" />
          ) : (
            <ul className="divide-y divide-border/70">
              {payments.data.map(p => {
                const patient = patientById.get(p.patientId);
                return (
                  <li key={p.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${p.patientId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.method.replaceAll("_", " ")} · {p.type} · {formatDate(p.paidAt)}
                      </p>
                    </div>
                    <StatusBadge status={p.type} />
                    <span
                      className={`text-sm font-semibold shrink-0 ${p.type === "refund" ? "text-destructive" : "text-emerald-700"}`}
                    >
                      {p.type === "refund" ? "-" : "+"}
                      {formatMoney(p.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Outstanding balances">
          {!invoices.data?.length ? (
            <EmptyState title="No outstanding balances" />
          ) : (
            <ul className="divide-y divide-border/70">
              {invoices.data
                .map(inv => {
                  const balance = balanceByInvoice.get(inv.id);
                  return { inv, balance };
                })
                .filter(x => x.balance && x.balance.balance > 0)
                .map(({ inv, balance }) => {
                  const patient = patientById.get(inv.patientId);
                  return (
                    <li key={inv.id} className="py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {patient ? `${patient.firstName} ${patient.lastName}` : `#${inv.patientId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{inv.invoiceNumber}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-700 shrink-0">
                        {formatMoney(balance!.balance)}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Payment dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record {paymentType === "refund" ? "Refund" : "Payment"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3.5"
            onSubmit={e => {
              e.preventDefault();
              if (!paymentInvoiceId) return;
              recordPayment.mutate({
                invoiceId: paymentInvoiceId,
                patientId: paymentPatientId,
                amount: Number(paymentAmount),
                method: paymentMethod,
                type: paymentType,
              });
            }}
          >
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={paymentType} onValueChange={v => setPaymentType(v as "payment" | "refund")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Amount ($)</Label>
              <Input type="number" min={0} step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Method</Label>
              <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as "cash")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={recordPayment.isPending} className="gap-1.5">
              {recordPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Record
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
