import { and, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  DashboardSummary,
  GenerateDisputeEvidenceParams,
  GenerateDisputeEvidenceResponse,
  GetDashboardActivityResponse,
  GetDashboardSummaryResponse,
  GetDisputeParams,
  GetDisputeResponse,
  ListDisputesQueryParams,
  ListDisputesResponse,
  ReceiveShopifyWebhookBody,
  ReceiveShopifyWebhookResponse,
  ReceiveStripeWebhookBody,
  ReceiveStripeWebhookResponse,
  SubmitDisputeParams,
  SubmitDisputeResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { disputesTable, type DisputeRow } from "@workspace/db/schema";

type EvidenceStatus = "verified" | "found" | "missing";
type EvidenceType =
  | "order"
  | "tracking"
  | "ip"
  | "email"
  | "delivery_photo"
  | "order_history";

type EvidenceItem = {
  id: string;
  type: EvidenceType;
  label: string;
  detail: string;
  status: EvidenceStatus;
  source: string;
};

const evidenceFor = (
  reason: "product_not_received" | "unrecognized" | "fraud",
  orderNumber = "#10482",
): EvidenceItem[] => [
  {
    id: "order",
    type: "order",
    label: "Order & payment",
    detail: `Order ${orderNumber} was paid in full with Visa ending in 4242.`,
    status: "verified",
    source: "Shopify",
  },
  {
    id: "tracking",
    type: "tracking",
    label: "Delivery confirmation",
    detail: "Delivered to the shipping address on Aug 28, 2026 at 2:14 PM.",
    status: "verified",
    source: "EasyPost",
  },
  {
    id: "ip",
    type: "ip",
    label: "Checkout fingerprint",
    detail: "IP 73.182.44.91 matches 3 previous successful orders.",
    status: reason === "fraud" ? "found" : "verified",
    source: "Stripe Radar",
  },
  {
    id: "email",
    type: "email",
    label: "Customer correspondence",
    detail: "No delivery issue was reported before the dispute was opened.",
    status: "found",
    source: "Gmail",
  },
  {
    id: "delivery-photo",
    type: "delivery_photo",
    label: "Delivery photo",
    detail: "Carrier photo shows the parcel at the front door.",
    status: "verified",
    source: "USPS",
  },
  {
    id: "history",
    type: "order_history",
    label: "Prior order history",
    detail: "4 prior orders, $486.00 total lifetime value.",
    status: "found",
    source: "Shopify",
  },
];

const seedRows: Array<typeof disputesTable.$inferInsert> = [
  {
    id: "dp_10482",
    orderNumber: "#10482",
    customerName: "Maya Chen",
    customerEmail: "maya.chen@gmail.com",
    amount: "186.00",
    currency: "USD",
    reason: "product_not_received",
    reasonLabel: "Product not received",
    status: "needs_action",
    statusLabel: "Needs action",
    deadline: "Sep 30, 2026",
    orderDate: "Aug 24, 2026",
    shippingAddress: "1180 Mission St, San Francisco, CA 94103",
    billingAddress: "1180 Mission St, San Francisco, CA 94103",
    paymentMethod: "Visa ending in 4242",
    trackingNumber: "9400111899223857194821",
    carrier: "USPS",
    deliveryDate: "Aug 28, 2026 at 2:14 PM",
    evidence: evidenceFor("product_not_received"),
    evidenceSummary:
      "The shipment was delivered to the cardholder's verified address, with carrier photo proof and matching order history.",
    pdfReady: true,
    submittedAt: null,
  },
  {
    id: "dp_10461",
    orderNumber: "#10461",
    customerName: "Jordan Alvarez",
    customerEmail: "jordan.alvarez@hey.com",
    amount: "94.00",
    currency: "USD",
    reason: "unrecognized",
    reasonLabel: "Unrecognized transaction",
    status: "submitted",
    statusLabel: "Submitted",
    deadline: "Sep 24, 2026",
    orderDate: "Aug 18, 2026",
    shippingAddress: "422 9th Ave, Brooklyn, NY 11215",
    billingAddress: "422 9th Ave, Brooklyn, NY 11215",
    paymentMethod: "Mastercard ending in 8210",
    trackingNumber: "1Z88A43Y0392018334",
    carrier: "UPS",
    deliveryDate: "Aug 21, 2026 at 11:42 AM",
    evidence: evidenceFor("unrecognized"),
    evidenceSummary:
      "The cardholder identity is supported by a matching billing address, device fingerprint, and prior successful purchases.",
    pdfReady: true,
    submittedAt: new Date("2026-09-04T15:42:00.000Z"),
  },
  {
    id: "dp_10402",
    orderNumber: "#10402",
    customerName: "Priya Nair",
    customerEmail: "priya.nair@icloud.com",
    amount: "248.00",
    currency: "USD",
    reason: "fraud",
    reasonLabel: "Fraudulent transaction",
    status: "won",
    statusLabel: "Won",
    deadline: "Sep 08, 2026",
    orderDate: "Aug 02, 2026",
    shippingAddress: "600 W 57th St, New York, NY 10019",
    billingAddress: "600 W 57th St, New York, NY 10019",
    paymentMethod: "Amex ending in 1005",
    trackingNumber: "9400136106192348730007",
    carrier: "USPS",
    deliveryDate: "Aug 05, 2026 at 4:06 PM",
    evidence: evidenceFor("fraud"),
    evidenceSummary:
      "The transaction passed 3DS authentication and shipped to the customer's established billing address.",
    pdfReady: true,
    submittedAt: new Date("2026-08-28T17:18:00.000Z"),
  },
  {
    id: "dp_10377",
    orderNumber: "#10377",
    customerName: "Elliot Brooks",
    customerEmail: "elliot.brooks@gmail.com",
    amount: "72.00",
    currency: "USD",
    reason: "product_not_received",
    reasonLabel: "Product not received",
    status: "lost",
    statusLabel: "Lost",
    deadline: "Aug 27, 2026",
    orderDate: "Jul 26, 2026",
    shippingAddress: "915 N Highland Ave, Los Angeles, CA 90038",
    billingAddress: "915 N Highland Ave, Los Angeles, CA 90038",
    paymentMethod: "Visa ending in 1117",
    trackingNumber: "9400111899223857194109",
    carrier: "USPS",
    deliveryDate: "Jul 30, 2026 at 10:24 AM",
    evidence: evidenceFor("product_not_received"),
    evidenceSummary:
      "The carrier event history confirms delivery, but the delivery photo was unavailable at submission time.",
    pdfReady: true,
    submittedAt: new Date("2026-08-14T18:05:00.000Z"),
  },
];

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  const [existing] = await db
    .select({ id: disputesTable.id })
    .from(disputesTable)
    .limit(1);
  if (!existing) {
    await db.insert(disputesTable).values(seedRows).onConflictDoNothing();
  }
  seeded = true;
}

function toDispute(row: DisputeRow) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    amount: Number(row.amount),
    currency: row.currency,
    reason: row.reason as "product_not_received" | "unrecognized" | "fraud",
    reasonLabel: row.reasonLabel,
    status: row.status as "needs_action" | "submitted" | "won" | "lost",
    statusLabel: row.statusLabel,
    deadline: row.deadline,
    orderDate: row.orderDate,
    createdAt: row.createdAt.toISOString(),
    evidenceCount: Array.isArray(row.evidence) ? row.evidence.length : 0,
    evidenceReady: row.pdfReady,
  };
}

function toDetail(row: DisputeRow) {
  return {
    ...toDispute(row),
    shippingAddress: row.shippingAddress,
    billingAddress: row.billingAddress,
    paymentMethod: row.paymentMethod,
    trackingNumber: row.trackingNumber,
    carrier: row.carrier,
    deliveryDate: row.deliveryDate,
    evidence: row.evidence as EvidenceItem[],
    evidenceSummary: row.evidenceSummary,
    pdfReady: row.pdfReady,
    submittedAt: row.submittedAt?.toISOString() ?? null,
  };
}

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res, next) => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(disputesTable);
    const recoveredAmount = rows
      .filter((row) => row.status === "won")
      .reduce((total, row) => total + Number(row.amount), 0);
    const decided = rows.filter((row) => row.status === "won" || row.status === "lost");
    const summary = {
      winRate: decided.length ? Math.round((rows.filter((row) => row.status === "won").length / decided.length) * 1000) / 10 : 0,
      recoveredAmount,
      openDisputes: rows.filter((row) => row.status === "needs_action" || row.status === "submitted").length,
      submittedThisMonth: rows.filter((row) => row.status === "submitted").length,
      winRateChange: 8.4,
      recoveredChange: 18.2,
      monthlyRecovery: [
        { month: "Apr", recovered: 840, disputes: 5 },
        { month: "May", recovered: 1260, disputes: 7 },
        { month: "Jun", recovered: 980, disputes: 6 },
        { month: "Jul", recovered: 1740, disputes: 9 },
        { month: "Aug", recovered: 2180, disputes: 11 },
        { month: "Sep", recovered: recoveredAmount, disputes: rows.length },
      ],
    };
    res.json(GetDashboardSummaryResponse.parse(summary));
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard/activity", async (_req, res, next) => {
  try {
    const activity = [
      {
        id: "activity-1",
        title: "Evidence package generated",
        description: "Dispute #10482 is ready for your review.",
        timestamp: "12 min ago",
        tone: "positive" as const,
      },
      {
        id: "activity-2",
        title: "Dispute submitted to Stripe",
        description: "Order #10461 · $94.00",
        timestamp: "Yesterday",
        tone: "neutral" as const,
      },
      {
        id: "activity-3",
        title: "Delivery photo found",
        description: "USPS proof added to Order #10402.",
        timestamp: "2 days ago",
        tone: "positive" as const,
      },
    ];
    res.json(GetDashboardActivityResponse.parse(activity));
  } catch (error) {
    next(error);
  }
});

router.get("/disputes", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { status, search } = ListDisputesQueryParams.parse(req.query);
    const conditions = [];
    if (status !== "all") {
      conditions.push(eq(disputesTable.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(disputesTable.orderNumber, `%${search}%`),
          ilike(disputesTable.customerName, `%${search}%`),
          ilike(disputesTable.customerEmail, `%${search}%`),
        ),
      );
    }
    const rows = await db
      .select()
      .from(disputesTable)
      .where(conditions.length ? and(...conditions) : undefined);
    res.json(ListDisputesResponse.parse(rows.map(toDispute)));
  } catch (error) {
    next(error);
  }
});

router.get("/disputes/:id", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id } = GetDisputeParams.parse(req.params);
    const [row] = await db.select().from(disputesTable).where(eq(disputesTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }
    res.json(GetDisputeResponse.parse(toDetail(row)));
  } catch (error) {
    next(error);
  }
});

router.post("/disputes/:id/generate-evidence", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id } = GenerateDisputeEvidenceParams.parse(req.params);
    const [row] = await db.select().from(disputesTable).where(eq(disputesTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }
    const evidence = Array.isArray(row.evidence)
      ? row.evidence
      : evidenceFor(row.reason as "product_not_received" | "unrecognized" | "fraud");
    const [updated] = await db
      .update(disputesTable)
      .set({ evidence, pdfReady: true })
      .where(eq(disputesTable.id, id))
      .returning();
    res.json(GenerateDisputeEvidenceResponse.parse(toDetail(updated)));
  } catch (error) {
    next(error);
  }
});

router.post("/disputes/:id/submit", async (req, res, next) => {
  try {
    await ensureSeeded();
    const { id } = SubmitDisputeParams.parse(req.params);
    const [row] = await db.select().from(disputesTable).where(eq(disputesTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }
    const [updated] = await db
      .update(disputesTable)
      .set({
        status: "submitted",
        statusLabel: "Submitted",
        pdfReady: true,
        submittedAt: new Date(),
      })
      .where(eq(disputesTable.id, id))
      .returning();
    res.json(SubmitDisputeResponse.parse(toDetail(updated)));
  } catch (error) {
    next(error);
  }
});

async function acceptWebhook(
  req: Request,
  res: Response,
  provider: "Stripe" | "Shopify Payments",
) {
  await ensureSeeded();
  const body =
    provider === "Stripe"
      ? ReceiveStripeWebhookBody.parse(req.body)
      : ReceiveShopifyWebhookBody.parse(req.body);
  const id = `dp_webhook_${body.eventId}`;
  const reasonLabel =
    body.reason === "product_not_received"
      ? "Product not received"
      : body.reason === "unrecognized"
        ? "Unrecognized transaction"
        : "Fraudulent transaction";
  const [existing] = await db.select().from(disputesTable).where(eq(disputesTable.id, id));
  if (!existing) {
    await db.insert(disputesTable).values({
      id,
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      amount: String(body.amount),
      currency: body.currency ?? "USD",
      reason: body.reason,
      reasonLabel,
      status: "needs_action",
      statusLabel: "Needs action",
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      orderDate: new Date().toISOString().slice(0, 10),
      shippingAddress: body.shippingAddress ?? "Pending Shopify lookup",
      billingAddress: body.billingAddress ?? "Pending Shopify lookup",
      paymentMethod: body.paymentMethod ?? "Pending Stripe lookup",
      trackingNumber: body.trackingNumber ?? "Pending carrier lookup",
      carrier: body.carrier ?? "Pending carrier lookup",
      deliveryDate: body.deliveryDate ?? "Pending carrier lookup",
      evidence: [],
      evidenceSummary: `${provider} webhook accepted. Defender is gathering order, tracking, identity, and customer history evidence.`,
      pdfReady: false,
      submittedAt: null,
    });
  }
  const accepted = { accepted: true, disputeId: id, message: `${provider} dispute received` };
  res.status(202).json(
    provider === "Stripe"
      ? ReceiveStripeWebhookResponse.parse(accepted)
      : ReceiveShopifyWebhookResponse.parse(accepted),
  );
}

router.post("/webhooks/stripe", async (req, res, next) => {
  try {
    await acceptWebhook(req, res, "Stripe");
  } catch (error) {
    next(error);
  }
});

router.post("/webhooks/shopify", async (req, res, next) => {
  try {
    await acceptWebhook(req, res, "Shopify Payments");
  } catch (error) {
    next(error);
  }
});

export default router;