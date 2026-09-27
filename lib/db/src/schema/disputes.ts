import { boolean, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disputesTable = pgTable("disputes", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  reason: text("reason").notNull(),
  reasonLabel: text("reason_label").notNull(),
  status: text("status").notNull(),
  statusLabel: text("status_label").notNull(),
  deadline: text("deadline").notNull(),
  orderDate: text("order_date").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  billingAddress: text("billing_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  trackingNumber: text("tracking_number").notNull(),
  carrier: text("carrier").notNull(),
  deliveryDate: text("delivery_date").notNull(),
  evidence: jsonb("evidence").notNull().default([]),
  evidenceSummary: text("evidence_summary").notNull(),
  pdfReady: boolean("pdf_ready").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDisputeSchema = createInsertSchema(disputesTable);
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type DisputeRow = typeof disputesTable.$inferSelect;