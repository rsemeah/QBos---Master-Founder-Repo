// packages/war-room/src/datasources/index.ts
// TODO: Implement ReceiptReader in TruthSerum for querying historical receipts

export interface DataSourceConfig {
  supabaseUrl?: string
  supabaseKey?: string
}

export class WarRoomDataSources {
  private config: DataSourceConfig

  constructor(config: DataSourceConfig = {}) {
    this.config = {
      supabaseUrl: config.supabaseUrl || process.env.SUPABASE_URL,
      supabaseKey: config.supabaseKey || process.env.SUPABASE_ANON_KEY
    }
  }

  // TruthSerum Data Sources
  async getRecentReceipts(hours: number): Promise<any[]> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      // For now, return empty array until receipt querying is implemented
      console.warn(`ReceiptReader not yet implemented - returning empty receipts for last ${hours} hours`)
      return []
    } catch (error) {
      console.warn('Failed to fetch receipts from TruthSerum:', error)
      return []
    }
  }

  async getUnverifiedAttempts(hours: number): Promise<number> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      console.warn('ReceiptReader not yet implemented - returning 0 unverified attempts')
      return 0
    } catch (error) {
      console.warn('Failed to fetch unverified attempts:', error)
      return 0
    }
  }

  calculateDrift(receipts: any[]): number {
    if (receipts.length === 0) return 0

    // Calculate drift score based on receipt patterns
    // Higher score = more drift from expected behavior
    try {
      const types = receipts.map(r => r.type)
      const typeFrequency: Record<string, number> = {}

      types.forEach(type => {
        typeFrequency[type] = (typeFrequency[type] || 0) + 1
      })

      // Calculate entropy as drift indicator
      const total = types.length
      let entropy = 0
      Object.values(typeFrequency).forEach(count => {
        const p = count / total
        entropy -= p * Math.log2(p)
      })

      // Normalize to 0-1 range (max entropy for ~16 types = 4 bits)
      return Math.min(entropy / 4, 1)
    } catch (error) {
      console.warn('Failed to calculate drift:', error)
      return 0
    }
  }

  // Engine Metrics Data Sources
  async getEngineMetrics(engine: string): Promise<{
    last_success: string
    error_rate: number
    fallback_rate: number
  }> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      // For now, return mock metrics
      return {
        last_success: new Date().toISOString(),
        error_rate: 0,
        fallback_rate: 0
      }
    } catch (error) {
      console.warn(`Failed to fetch metrics for ${engine}:`, error)
      return {
        last_success: new Date().toISOString(),
        error_rate: 0,
        fallback_rate: 0
      }
    }
  }

  // Robby PA Data Sources
  async getRobbyBlockedActions(hours: number): Promise<number> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      return 0
    } catch (error) {
      console.warn('Failed to fetch Robby blocked actions:', error)
      return 0
    }
  }

  async getRobbyInterrupts(hours: number): Promise<number> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      return 0
    } catch (error) {
      console.warn('Failed to fetch Robby interrupts:', error)
      return 0
    }
  }

  async getRobbyAutonomyLevel(): Promise<number> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      return 2 // Default to level 2
    } catch (error) {
      console.warn('Failed to fetch Robby autonomy level:', error)
      return 2
    }
  }

  async getRobbyConfidenceDelta(): Promise<number> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      return 0
    } catch (error) {
      console.warn('Failed to calculate Robby confidence delta:', error)
      return 0
    }
  }

  // Cost/Spend Data Sources
  async getCurrentSpendRate(): Promise<number> {
    try {
      // TODO: Implement ReceiptReader in TruthSerum
      return 0.5 // Default fallback $0.50/hour
    } catch (error) {
      console.warn('Failed to fetch current spend rate:', error)
      return 0.5
    }
  }

  // Persistence to Supabase (optional - for when Supabase is available)
  async persistHealthSnapshot(snapshot: any): Promise<void> {
    // TODO: Implement Supabase persistence when available
    // For now, just emit receipt via TruthSerum
    console.log('Health snapshot:', snapshot.overall_status)
  }

  async persistRegressionResult(result: any): Promise<void> {
    // TODO: Implement Supabase persistence when available
    console.log('Regression result:', result.passed ? 'PASSED' : 'FAILED')
  }

  async persistEvent(event: any): Promise<void> {
    // TODO: Implement Supabase persistence when available
    console.log('Event ingested:', event.severity, event.message)
  }
}

// Singleton instance
export const dataSources = new WarRoomDataSources()
