import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Print from "expo-print";
import { getAppSettings } from "@/services/appSettings";

const PRINTER_SETTINGS_KEY = "printer_settings";

export type PaperWidth = 58 | 80;

export type PrinterSettings = {
  paperWidth: PaperWidth;
  showStoreName: boolean;
  showDate: boolean;
  showPayment: boolean;
  footerText: string;
  showCashierName: boolean;
  printerName?: string;
  printerConnected?: boolean;
};

export type ReceiptInput = {
  storeName?: string;
  employeeName?: string;
  transactionId?: string;
  createdAt?: Date | number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  paid: number;
  change: number;
};

const DEFAULT_SETTINGS: PrinterSettings = {
  paperWidth: 58,
  showStoreName: true,
  showDate: true,
  showPayment: true,
  footerText: "Terima kasih",
  showCashierName: true,
};

export async function getPrinterSettings(): Promise<PrinterSettings> {
  const raw = await AsyncStorage.getItem(PRINTER_SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<PrinterSettings>;
    return {
      paperWidth: parsed.paperWidth === 80 ? 80 : 58,
      showStoreName: parsed.showStoreName !== false,
      showDate: parsed.showDate !== false,
      showPayment: parsed.showPayment !== false,
      footerText: typeof parsed.footerText === "string" ? parsed.footerText : DEFAULT_SETTINGS.footerText,
      showCashierName: parsed.showCashierName !== false,
      printerName: typeof parsed.printerName === "string" ? parsed.printerName : undefined,
      printerConnected: parsed.printerConnected === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function savePrinterSettings(settings: PrinterSettings) {
  await AsyncStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function currency(value: number) {
  return `Rp ${Math.max(0, Math.round(value || 0)).toLocaleString("id-ID")}`;
}

function paymentLabel(value: string) {
  return ({ cash: "Tunai", qris: "QRIS", transfer: "Transfer" } as Record<string, string>)[value] || value;
}

export function buildReceiptHtml(
  receipt: ReceiptInput,
  paperWidth: PaperWidth,
  settings: PrinterSettings = DEFAULT_SETTINGS
) {
  const paid = Math.max(0, Number(receipt.paid) || 0);
  const change = Math.max(0, paid - Math.max(0, Number(receipt.total) || 0));
  const date = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleString("id-ID")
    : new Date().toLocaleString("id-ID");
  const rows = receipt.items
    .map(
      (item) => `
        <div class="item">
          <div class="name">${escapeHtml(item.name)}</div>
          <div class="line"><span>${item.qty} x ${currency(item.price)}</span><span>${currency(item.qty * item.price)}</span></div>
        </div>`
    )
    .join("");

  return `<!doctype html>
    <html><head><meta charset="utf-8" />
      <style>
        @page { size: ${paperWidth}mm auto; margin: 0; }
        * { box-sizing: border-box; }
        body { width: ${paperWidth}mm; margin: 0; padding: 4mm; font-family: monospace; color: #111; font-size: 12px; }
        .center { text-align: center; } .bold { font-weight: 700; }
        .line { display: flex; justify-content: space-between; gap: 8px; }
        .name { word-break: break-word; margin-bottom: 2px; }
        .item { margin: 7px 0; } .rule { border-top: 1px dashed #111; margin: 8px 0; }
        .total { font-size: 15px; font-weight: 700; margin-top: 8px; }
        .muted { color: #444; font-size: 10px; }
      </style>
    </head><body>
      ${settings.showStoreName ? `<div class="center bold">${escapeHtml(receipt.storeName || "KasirPuintar")}</div>` : ""}
      ${settings.showDate ? `<div class="center muted">${escapeHtml(date)}</div>` : ""}
      ${receipt.transactionId ? `<div class="center muted">${escapeHtml(receipt.transactionId.slice(0, 8))}</div>` : ""}
      ${settings.showCashierName && receipt.employeeName ? `<div class="center muted">Kasir: ${escapeHtml(receipt.employeeName)}</div>` : ""}
      <div class="rule"></div>
      ${rows}
      <div class="rule"></div>
      <div class="line total"><span>TOTAL</span><span>${currency(receipt.total)}</span></div>
      ${settings.showPayment ? `<div class="line"><span>Metode</span><span>${escapeHtml(paymentLabel(receipt.paymentMethod))}</span></div>` : ""}
      ${settings.showPayment ? `<div class="line"><span>Dibayar</span><span>${currency(paid)}</span></div>` : ""}
      ${change > 0 ? `<div class="line"><span>Kembalian</span><span>${currency(change)}</span></div>` : ""}
      <div class="center muted" style="margin-top: 14px">${escapeHtml(settings.footerText)}</div>
    </body></html>`;
}

export async function printReceipt(receipt: ReceiptInput) {
  const [settings, appSettings] = await Promise.all([getPrinterSettings(), getAppSettings()]);
  const width = settings.paperWidth === 80 ? 226.77 : 164.41;
  await Print.printAsync({
    html: buildReceiptHtml(
      { ...receipt, storeName: receipt.storeName || appSettings.storeName },
      settings.paperWidth,
      settings,
    ),
    width,
  });
}

export async function testPrint() {
  await printReceipt({
    storeName: "KasirPuintar - TEST",
    items: [{ name: "Test Printer", qty: 1, price: 1000 }],
    total: 1000,
    paymentMethod: "cash",
    paid: 1000,
    change: 0,
  });
}

export function printerModeLabel() {
  if (Platform.OS === "web") return "Dialog print browser";
  return "Layanan print sistem perangkat";
}
