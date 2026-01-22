// packages/delivery-kernel/src/journeys/index.ts

/**
 * JourneysEngine - Sprint and Scrum Generation
 * Transforms BuildPlan into actionable sprints with Scrum artifacts
 */

import { ReceiptWriter } from '@qbos/truthserum'
import type {
  BuildPlan,
  Sprint,
  ScrumArtifacts,
  BacklogItem,
  SprintBacklog
} from '../types.js'

export class JourneysEngine {
  /**
   * Generate Scrum artifacts from build plan
   */
  async generateScrumArtifacts(plan: BuildPlan, sessionId: string): Promise<ScrumArtifacts> {
    // Generate product backlog from features
    const productBacklog = this.generateProductBacklog(plan)

    // Generate sprint backlogs
    const sprintBacklogs = this.generateSprintBacklogs(plan.sprints, productBacklog)

    // Generate definition of done
    const definitionOfDone = this.generateDefinitionOfDone(plan)

    const artifacts: ScrumArtifacts = {
      product_backlog: productBacklog,
      sprint_backlogs: sprintBacklogs,
      definition_of_done: definitionOfDone,
      retrospective_notes: []
    }

    // Emit receipt
    await ReceiptWriter.write({
      sessionId,
      type: 'journeys.artifacts.generated',
      details: {
        plan_id: plan.id,
        product_backlog_items: productBacklog.length,
        sprint_backlogs_count: sprintBacklogs.length
      }
    })

    return artifacts
  }

  /**
   * Generate product backlog from features
   */
  private generateProductBacklog(plan: BuildPlan): BacklogItem[] {
    return plan.scope.features.map((feature: any, index: number) => {
      const userStory = this.featureToUserStory(feature)

      return {
        id: `backlog-${index + 1}`,
        user_story: userStory,
        acceptance_criteria: [
          `${feature.name} is implemented`,
          `Tests pass for ${feature.name}`,
          `Documentation updated`
        ],
        story_points: feature.complexity,
        priority: this.priorityToNumber(feature.priority),
        sprint: this.assignToSprint(feature.name, plan.sprints)
      }
    })
  }

  /**
   * Convert feature to user story format
   */
  private featureToUserStory(feature: any): string {
    return `As a user, I want ${feature.name.toLowerCase()}, so that ${feature.description || 'I can use the application effectively'}.`
  }

  /**
   * Convert priority to number
   */
  private priorityToNumber(priority: string): number {
    switch (priority) {
      case 'must-have': return 1
      case 'should-have': return 2
      case 'nice-to-have': return 3
      default: return 2
    }
  }

  /**
   * Assign feature to sprint
   */
  private assignToSprint(featureName: string, sprints: Sprint[]): number {
    for (const sprint of sprints) {
      if (sprint.features.includes(featureName)) {
        return sprint.number
      }
    }
    return 1 // Default to first sprint
  }

  /**
   * Generate sprint backlogs
   */
  private generateSprintBacklogs(sprints: Sprint[], productBacklog: BacklogItem[]): SprintBacklog[] {
    return sprints.map(sprint => {
      const sprintItems = productBacklog.filter(item => item.sprint === sprint.number)
      const capacity = sprint.duration_estimate
      const velocityEstimate = sprintItems.reduce((sum, item) => sum + item.story_points, 0)

      return {
        sprint_number: sprint.number,
        items: sprintItems,
        capacity,
        velocity_estimate: velocityEstimate
      }
    })
  }

  /**
   * Generate definition of done
   */
  private generateDefinitionOfDone(plan: BuildPlan): string[] {
    return [
      'Code is written and committed',
      'Unit tests pass',
      'Integration tests pass',
      'Code review completed',
      'Documentation updated',
      'TruthSerum receipts generated',
      'No security vulnerabilities',
      'Performance benchmarks met',
      'Acceptance criteria satisfied'
    ]
  }

  /**
   * Generate sprint retrospective template
   */
  async generateRetrospective(sprintNumber: number, sessionId: string): Promise<string[]> {
    const notes = [
      `# Sprint ${sprintNumber} Retrospective`,
      '',
      '## What went well?',
      '- [To be filled]',
      '',
      '## What could be improved?',
      '- [To be filled]',
      '',
      '## Action items',
      '- [To be filled]'
    ]

    await ReceiptWriter.write({
      sessionId,
      type: 'journeys.retrospective.generated',
      details: { sprint_number: sprintNumber }
    })

    return notes
  }
}
