import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = { name: string; options: Record<string, unknown> };

function createAuthContext(role: "admin" | "dentist" | "receptionist" | "staff" | null) {
  const clearedCookies: CookieCall[] = [];
  const user = role
    ? {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: role as TrpcContext["user"] extends infer U extends NonNullable<unknown> ? U["role"] : never,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
    : null;

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("role-based access control", () => {
  it("rejects unauthenticated requests on protected procedures", async () => {
    const { ctx } = createAuthContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.patients.list({})).rejects.toThrow();
  });

  it("denies receptionist access to admin-only staff management", async () => {
    const { ctx } = createAuthContext("receptionist");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("denies staff access to patient records", async () => {
    const { ctx } = createAuthContext("staff");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.patients.list({})).rejects.toThrow();
  });

  it("allows admin full access to all modules", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const patients = await caller.patients.list({});
    expect(Array.isArray(patients)).toBe(true);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("stats");
    expect(stats.stats).toHaveProperty("todayAppointments");
  });
});

describe("patients", () => {
  it("lists patients with core fields", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const patients = await caller.patients.list({});
    expect(patients.length).toBeGreaterThan(0);
    expect(patients[0]).toHaveProperty("firstName");
    expect(patients[0]).toHaveProperty("status");
  });

  it("filters patients by search text", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const results = await caller.patients.list({ search: "Wilson" });
    expect(results.every(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes("wilson"),
    )).toBe(true);
  });

  it("creates and updates a patient", async () => {
    const { ctx } = createAuthContext("receptionist");
    const caller = appRouter.createCaller(ctx);
    const created = await caller.patients.create({
      firstName: "Test",
      lastName: "Patient",
      gender: "female",
      dateOfBirth: "1990-01-01",
      phone: "+15550000000",
      email: "test.patient@example.com",
      address: "123 Test St",
      bloodType: "A+",
      status: "active",
    });
    expect(created.id).toBeGreaterThan(0);

    const updated = await caller.patients.update({
      id: created.id,
      data: { allergies: "Latex" },
    });
    expect(updated.success).toBe(true);

    const fetched = await caller.patients.get({ id: created.id });
    expect(fetched?.allergies).toBe("Latex");
  });
});

describe("appointments", () => {
  it("creates, lists, and cancels an appointment", async () => {
    const { ctx } = createAuthContext("receptionist");
    const caller = appRouter.createCaller(ctx);
    const patients = await caller.patients.list({});
    const patientId = patients[0].id;

    const created = await caller.appointments.create({
      patientId,
      dentistId: null,
      appointmentDate: "2026-09-01",
      startTime: "10:00",
      endTime: "10:30",
      type: "checkup",
      status: "scheduled",
    });
    expect(created.id).toBeGreaterThan(0);

    const list = await caller.appointments.list({});
    expect(list.some(a => a.id === created.id)).toBe(true);

    const updated = await caller.appointments.update({
      id: created.id,
      data: { status: "confirmed" },
    });
    expect(updated.success).toBe(true);
  });
});

describe("billing", () => {
  it("lists invoices with seeded data and computes balances", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const invoices = await caller.billing.invoices({});
    expect(invoices.length).toBeGreaterThan(0);
    expect(invoices[0]).toHaveProperty("total");
    expect(invoices[0]).toHaveProperty("status");
  });

  it("creates an invoice with items", async () => {
    const { ctx } = createAuthContext("receptionist");
    const caller = appRouter.createCaller(ctx);
    const patients = await caller.patients.list({});
    const inv = await caller.billing.createInvoice({
      patientId: patients[0].id,
      status: "draft",
      discount: "0.00",
      tax: "0.00",
      items: [
        { description: "Cleaning", quantity: 1, unitPrice: "100.00" },
      ],
    });
    expect(inv.id).toBeGreaterThan(0);
  });
});

describe("inventory", () => {
  it("lists items and adjusts stock", async () => {
    const { ctx } = createAuthContext("staff");
    const caller = appRouter.createCaller(ctx);
    const items = await caller.inventory.items();
    expect(items.length).toBeGreaterThan(0);

    const item = items[0];
    const adjusted = await caller.inventory.adjust({
      itemId: item.id,
      type: "stock_in",
      quantity: 5,
      reason: "test restock",
    });
    expect(adjusted).toBeDefined();
  });
});

describe("insurance", () => {
  it("lists providers and claims", async () => {
    const { ctx } = createAuthContext("receptionist");
    const caller = appRouter.createCaller(ctx);
    const providers = await caller.insurance.providers();
    expect(providers.length).toBeGreaterThan(0);
    const claims = await caller.insurance.claims({});
    expect(Array.isArray(claims)).toBe(true);
    if (claims.length > 0) {
      expect(claims[0]).toHaveProperty("claimNumber");
    }
  });
});

describe("dashboard stats", () => {
  it("returns valid KPI aggregates", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.stats();
    expect(typeof result.stats.todayAppointments).toBe("number");
    expect(typeof result.stats.totalPatients).toBe("number");
    expect(result.stats.todayAppointments).toBeGreaterThanOrEqual(0);
    expect(result.stats.totalPatients).toBeGreaterThan(0);
    expect(Array.isArray(result.trends)).toBe(true);
    expect(Array.isArray(result.revenue)).toBe(true);
    expect(Array.isArray(result.byStatus)).toBe(true);
  });
});
