import { Logger } from '@qbos/logger';
import { MetricsCollector } from '@qbos/metrics';
import { EventEmitter } from 'events';
import { EngineConfig } from './types';
import { ExecutionContext } from './ExecutionContext';
import { StateManager } from './StateManager';
import { SecurityManager } from './SecurityManager';
import { ResourceManager } from './ResourceManager';
import { ErrorHandler } from './ErrorHandler';
import { ValidationEngine } from './ValidationEngine';
import { MonitoringService } from './MonitoringService';
import { CacheManager } from './CacheManager';
import { QueueManager } from './QueueManager';
import { RetryManager } from './RetryManager';
import { CircuitBreaker } from './CircuitBreaker';
import { RateLimiter } from './RateLimiter';
import { RobEngine } from './RobEngine';

/**
 * EngineOrchestrator coordinates multiple engines and manages their lifecycle
 */
export class EngineOrchestrator extends EventEmitter {
  private logger: Logger;
  private metrics: MetricsCollector;
  private stateManager: StateManager;
  private securityManager: SecurityManager;
  private resourceManager: ResourceManager;
  private errorHandler: ErrorHandler;
  private validationEngine: ValidationEngine;
  private monitoringService: MonitoringService;
  private cacheManager: CacheManager;
  private queueManager: QueueManager;
  private retryManager: RetryManager;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;
  private robEngine: RobEngine;
  private isInitialized: boolean = false;
  private isShuttingDown: boolean = false;

  constructor(private config: EngineConfig) {
    super();
    this.logger = new Logger('EngineOrchestrator');
    this.metrics = new MetricsCollector('orchestrator');
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.stateManager = new StateManager(this.config);
    this.securityManager = new SecurityManager(this.config);
    this.resourceManager = new ResourceManager(this.config);
    this.errorHandler = new ErrorHandler(this.logger);
    this.validationEngine = new ValidationEngine(this.config);
    this.monitoringService = new MonitoringService(this.config);
    this.cacheManager = new CacheManager(this.config);
    this.queueManager = new QueueManager(this.config);
    this.retryManager = new RetryManager(this.config);
    this.circuitBreaker = new CircuitBreaker(this.config);
    this.rateLimiter = new RateLimiter(this.config);
    this.robEngine = new RobEngine(this.config);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('EngineOrchestrator already initialized');
      return;
    }

    try {
      this.logger.info('Initializing EngineOrchestrator');
      
      await this.stateManager.initialize();
      await this.securityManager.initialize();
      await this.resourceManager.initialize();
      await this.validationEngine.initialize();
      await this.monitoringService.initialize();
      await this.cacheManager.initialize();
      await this.queueManager.initialize();
      await this.robEngine.initialize();

      this.isInitialized = true;
      this.emit('initialized');
      this.logger.info('EngineOrchestrator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize EngineOrchestrator', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('EngineOrchestrator already shutting down');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Shutting down EngineOrchestrator');

    try {
      await this.robEngine.shutdown();
      await this.queueManager.shutdown();
      await this.cacheManager.shutdown();
      await this.monitoringService.shutdown();
      await this.validationEngine.shutdown();
      await this.resourceManager.shutdown();
      await this.securityManager.shutdown();
      await this.stateManager.shutdown();

      this.isInitialized = false;
      this.emit('shutdown');
      this.logger.info('EngineOrchestrator shut down successfully');
    } catch (error) {
      this.logger.error('Error during EngineOrchestrator shutdown', error);
      throw error;
    }
  }
}
