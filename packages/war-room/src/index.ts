// packages/war-room/src/index.ts
export * from './types'
export * from './ingest'
export * from './health'
export * from './regression'
export * from './cost'
export * from './robby'
export * from './controls'
export * from './datasources'
export * from './impact'
export * from './drift'
export * from './runbooks'

import { IngestLayer } from './ingest'
import { HealthMonitor } from './health'
import { RegressionRunner } from './regression'
import { CostMonitor } from './cost'
import { RobbyMonitor } from './robby'
import { EmergencyControls } from './controls'

export class WarRoom {
  public ingest: IngestLayer
  public health: HealthMonitor
  public regression: RegressionRunner
  public cost: CostMonitor
  public robby: RobbyMonitor
  public controls: EmergencyControls

  constructor() {
    this.ingest = new IngestLayer()
    this.health = new HealthMonitor()
    this.regression = new RegressionRunner()
    this.cost = new CostMonitor()
    this.robby = new RobbyMonitor()
    this.controls = new EmergencyControls()
  }

  async status(): Promise<{
    frozen: boolean
    health: any
    robby: any
    cost: any
  }> {
    const frozen = this.controls.isFrozen()
    const health = await this.health.getStatus()
    const robby = await this.robby.getHealth()
    const cost = await this.cost.getHealth()

    return {
      frozen,
      health,
      robby,
      cost
    }
  }
}

// Singleton instance
export const warRoom = new WarRoom()
