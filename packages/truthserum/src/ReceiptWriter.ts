/**
 * ReceiptWriter - Append-only receipt storage
 * Writes to Supabase if configured, falls back to local file
 */

import { Receipt, ProofType } from "./types";
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from "fs";
import * as path from "path";

export interface ReceiptWriterConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  localFallbackPath?: string;
}

export interface ReceiptData {
  sessionId: string;
  type: string;
  details: Record<string, any>;
  parentReceiptId?: string;
}

export class ReceiptWriter {
  private config: ReceiptWriterConfig;
  private useSupabase: boolean;
  private supabase: SupabaseClient | null = null;
  private fallbackPath: string;

  constructor(supabaseUrlOrConfig?: string | ReceiptWriterConfig, supabaseKey?: string) {
    // Support both constructor signatures:
    // new ReceiptWriter(url, key) - for spec compliance
    // new ReceiptWriter(config) - for backward compatibility
    if (typeof supabaseUrlOrConfig === 'string') {
      this.config = {
        supabaseUrl: supabaseUrlOrConfig,
        supabaseKey: supabaseKey,
        localFallbackPath: "./proof/local_receipts.jsonl"
      };
    } else {
      this.config = {
        localFallbackPath: "./proof/local_receipts.jsonl",
        ...(supabaseUrlOrConfig || {})
      };
    }

    this.fallbackPath = this.config.localFallbackPath!;
    this.useSupabase = Boolean(this.config.supabaseUrl && this.config.supabaseKey);

    if (this.useSupabase) {
      this.supabase = createClient(this.config.supabaseUrl!, this.config.supabaseKey!);
    }
  }

  /**
   * Write a receipt (new simplified interface for build system)
   */
  async write(data: ReceiptData): Promise<{ id: string; hash: string }> {
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(data.details))
      .digest('hex');

    try {
      if (!this.supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: receipt, error } = await this.supabase
        .from('build_receipts')
        .insert({
          session_id: data.sessionId,
          type: data.type,
          details: data.details,
          verification_hash: hash,
          parent_receipt_id: data.parentReceiptId || null
        })
        .select()
        .single();

      if (error) throw error;

      return { id: receipt.id, hash };

    } catch (error) {
      console.error('[ReceiptWriter] Supabase failed, using fallback:', error);

      // Fallback to local file
      const fallbackReceipt = {
        id: crypto.randomUUID(),
        ...data,
        verification_hash: hash,
        created_at: new Date().toISOString()
      };

      const dir = path.dirname(this.fallbackPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(
        this.fallbackPath,
        JSON.stringify(fallbackReceipt) + '\n'
      );

      return { id: fallbackReceipt.id, hash };
    }
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
