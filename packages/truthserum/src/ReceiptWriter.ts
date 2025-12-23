/**
 * ReceiptWriter - Append-only receipt storage
 * Writes to Supabase if configured, falls back to local file
 */

import { Receipt, ProofType } from "./types";
import * as fs from "fs";
import * as path from "path";

export interface ReceiptWriterConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  localFallbackPath?: string;
}

export class ReceiptWriter {
  private config: ReceiptWriterConfig;
  private useSupabase: boolean;

  constructor(config: ReceiptWriterConfig = {}) {
    this.config = {
      localFallbackPath: config.localFallbackPath || "./proof/local_receipts.jsonl",
      ...config,
    };
    this.useSupabase = Boolean(config.supabaseUrl && config.supabaseKey);
  }

  /**
   * Write a receipt (append-only)
   */
  async writeReceipt(receipt: Omit<Receipt, "id" | "createdAt">): Promise<Receipt> {
    const fullReceipt: Receipt = {
      id: this.generateId(),
      createdAt: new Date(),
      ...receipt,
    };

    if (this.useSupabase) {
      await this.writeToSupabase(fullReceipt);
    } else {
      await this.writeToLocalFile(fullReceipt);
    }

    return fullReceipt;
  }

  /**
   * Read receipts for a session
   */
  async readReceipts(sessionId?: string): Promise<Receipt[]> {
    if (this.useSupabase) {
      return this.readFromSupabase(sessionId);
    } else {
      return this.readFromLocalFile(sessionId);
    }
  }

  private async writeToSupabase(receipt: Receipt): Promise<void> {
    // TODO: Implement when Supabase client is configured
    // For now, also write to local as backup
    await this.writeToLocalFile(receipt);
  }

  private async readFromSupabase(sessionId?: string): Promise<Receipt[]> {
    // TODO: Implement when Supabase client is configured
    return this.readFromLocalFile(sessionId);
  }

  private async writeToLocalFile(receipt: Receipt): Promise<void> {
    const filePath = this.config.localFallbackPath!;
    const dir = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Append as JSONL (one JSON object per line)
    const line = JSON.stringify(receipt) + "\n";
    fs.appendFileSync(filePath, line, "utf-8");
  }

  private async readFromLocalFile(sessionId?: string): Promise<Receipt[]> {
    const filePath = this.config.localFallbackPath!;

    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const receipts: Receipt[] = lines.map((line) => {
      const parsed = JSON.parse(line);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
      };
    });

    if (sessionId) {
      return receipts.filter((r) => r.sessionId === sessionId);
    }

    return receipts;
  }

  private generateId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
