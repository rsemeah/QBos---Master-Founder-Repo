import { getReceiptsDir } from "@qbos/run";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import keystore from "./keystore.js";

interface Receipt {
  id: string;
  createdAt: string;
  sessionId?: string | null;
  type: string;
  details: Record<string, any>;
  parentReceiptId?: string | null;
  signerKeyId?: string | null;
  signature?: string | null;
  algo?: string | null;
  nonce?: string | null;
  verification_hash?: string | null;
}

class ReceiptWriterImpl {
  private supabase: SupabaseClient | null = null;
  private useSupabase = false;
  private config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  };

  constructor() {
    if (this.config.supabaseUrl && this.config.supabaseKey) {
      this.supabase = createClient(
        this.config.supabaseUrl,
        this.config.supabaseKey
      );
      this.useSupabase = true;
    }
  }

  private generateId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private canonicalize(obj: any): string {
    const step = (v: any): any => {
      if (v === null || typeof v !== "object") return v;
      if (Array.isArray(v)) return v.map(step);
      const out: any = {};
      Object.keys(v)
        .sort()
        .forEach((k) => {
          out[k] = step(v[k]);
        });
      return out;
    };
    return JSON.stringify(step(obj));
  }

  async write(data: {
    sessionId?: string | null;
    type: string;
    details: Record<string, any>;
    parentReceiptId?: string | null;
  }): Promise<{ id: string; hash: string }> {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data.details))
      .digest("hex");
    const fallbackReceipt: any = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      ...data,
      verification_hash: hash,
    };

    if (!this.useSupabase || !this.supabase) {
      await this.writeToLocalFile(fallbackReceipt);
      return { id: fallbackReceipt.id, hash };
    }

    try {
      const { data: receipt, error } = await this.supabase
        .from("build_receipts")
        .insert({
          session_id: data.sessionId || null,
          type: data.type,
          details: data.details,
          verification_hash: hash,
          parent_receipt_id: data.parentReceiptId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { id: receipt.id, hash };
    } catch (e) {
      await this.writeToLocalFile(fallbackReceipt);
      return { id: fallbackReceipt.id, hash };
    }
  }

  async writeReceipt(
    receipt: Omit<Receipt, "id" | "createdAt">
  ): Promise<Receipt> {
    const full: Receipt = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      ...receipt,
    } as any;

    const verification_hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(full.details))
      .digest("hex");
    const nonce = crypto.randomBytes(16).toString("hex");

    const unsigned = {
      id: full.id,
      createdAt: full.createdAt,
      sessionId: full.sessionId || null,
      type: full.type,
      verification_hash,
      parentReceiptId: full.parentReceiptId || null,
      nonce,
    };

    const canonical = this.canonicalize(unsigned);

    keystore.init();
    const { signature, keyId } = keystore.sign(canonical);

    const signedReceipt: Receipt = {
      ...full,
      verification_hash,
      nonce,
      signerKeyId: keyId,
      signature,
      algo: "Ed25519",
    };

    if (this.useSupabase) {
      await this.writeToSupabase(signedReceipt);
    } else {
      await this.writeToLocalFile(signedReceipt);
    }

    return signedReceipt;
  }

  async verifyReceipt(receipt: any): Promise<boolean> {
    if (!receipt || !receipt.signature || !receipt.signerKeyId) return false;
    try {
      const verification_hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(receipt.details))
        .digest("hex");
      if (receipt.verification_hash !== verification_hash) return false;

      const unsigned = {
        id: receipt.id,
        createdAt: receipt.createdAt,
        sessionId: receipt.sessionId || null,
        type: receipt.type,
        verification_hash: receipt.verification_hash,
        parentReceiptId: receipt.parentReceiptId || null,
        nonce: receipt.nonce,
      };

      const canonical = this.canonicalize(unsigned);
      return await keystore.verify(
        canonical,
        receipt.signature,
        receipt.signerKeyId
      );
    } catch (e) {
      console.error("[ReceiptWriter] verifyReceipt error", e);
      return false;
    }
  }

  private async writeToSupabase(receipt: Receipt): Promise<void> {
    if (!this.supabase) return this.writeToLocalFile(receipt);
    try {
      const payload: any = {
        id: receipt.id,
        created_at: receipt.createdAt,
        session_id: receipt.sessionId || null,
        type: receipt.type,
        details: receipt.details,
        verification_hash: receipt.verification_hash || null,
        parent_receipt_id: receipt.parentReceiptId || null,
        signer_key_id: receipt.signerKeyId || null,
        signature: receipt.signature || null,
        algo: receipt.algo || null,
        nonce: receipt.nonce || null,
      };

      const { error } = await this.supabase
        .from("build_receipts")
        .insert(payload);
      if (error) {
        console.error("[ReceiptWriter] Supabase insert error:", error);
        await this.writeToLocalFile(receipt);
      }
    } catch (e) {
      console.error("[ReceiptWriter] writeToSupabase exception:", e);
      await this.writeToLocalFile(receipt);
    }
  }

  private async writeToLocalFile(receipt: any): Promise<void> {
    const filePath = this.resolveLocalPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(filePath, JSON.stringify(receipt) + "\n", "utf-8");
  }

  async readReceipts(sessionId?: string): Promise<Receipt[]> {
    if (this.useSupabase && this.supabase) {
      try {
        let q: any = this.supabase.from("build_receipts").select("*");
        if (sessionId) q = q.eq("session_id", sessionId);
        q = q.order("created_at", { ascending: true });
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map((r: any) => ({
          id: r.id,
          createdAt: r.created_at,
          sessionId: r.session_id,
          type: r.type,
          details: r.details,
          parentReceiptId: r.parent_receipt_id || undefined,
          signerKeyId: r.signer_key_id || undefined,
          signature: r.signature || undefined,
          algo: r.algo || undefined,
          nonce: r.nonce || undefined,
          verification_hash: r.verification_hash || undefined,
        }));
      } catch (e) {
        console.error("[ReceiptWriter] readReceipts supabase error", e);
        return this.readFromLocalFile(sessionId);
      }
    }
    return this.readFromLocalFile(sessionId);
  }

  private readFromLocalFile(sessionId?: string): Receipt[] {
    const filePath = this.resolveLocalPath();
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const receipts = lines
      .map((line) => JSON.parse(line))
      .map((r: any) => ({ ...r }));
    if (sessionId) return receipts.filter((r) => r.sessionId === sessionId);
    return receipts;
  }

  private resolveLocalPath(): string {
    const override = process.env.TRUTHSERUM_RECEIPTS_DIR;
    const baseDir = override || getReceiptsDir("truthserum");
    return path.join(baseDir, "local_receipts.jsonl");
  }
}

export const ReceiptWriter = new ReceiptWriterImpl();

export default ReceiptWriter;
