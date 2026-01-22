// packages/war-room/src/ingest/index.ts
import { OpsEvent, Severity } from '../types'
import { ReceiptWriter } from '@qbos/truthserum'

export class IngestLayer {
  private events: OpsEvent[] = []

  async ingest(source: string, data: any): Promise<OpsEvent> {
    const event: OpsEvent = {
      id: `evt_${Date.now()}`,
      source: source as any,
      severity: this.determineSeverity(data),
      timestamp: new Date().toISOString(),
      message: this.extractMessage(data),
      related_receipts: this.extractReceipts(data),
      metadata: data
    }

    this.events.push(event)

    // Emit war room receipt
    await ReceiptWriter.write({
      sessionId: 'war-room',
      type: 'ops.event.ingested',
      details: {
        event_id: event.id,
        source: event.source,
        severity: event.severity
      }
    })

    return event
  }

  private determineSeverity(data: any): Severity {
    // Logic to determine severity from data
    if (data.error) return 'red'
    if (data.warning) return 'yellow'
    return 'green'
  }

  private extractMessage(data: any): string {
    return data.message || data.error || 'Unknown event'
  }

  private extractReceipts(data: any): string[] {
    return data.receipts || data.receipt_id ? [data.receipt_id] : []
  }

  getEvents(filters?: { severity?: string; source?: string }): OpsEvent[] {
    let filtered = this.events

    if (filters?.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity)
    }

    if (filters?.source) {
      filtered = filtered.filter(e => e.source === filters.source)
    }

    return filtered
  }
}
