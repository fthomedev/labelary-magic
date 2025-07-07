
export interface ProcessingConfig {
  delayBetweenBatches: number;
  labelsPerBatch: number;
  maxRetries: number;
  fallbackDelay: number;
}

export interface ProcessingMetrics {
  batchStartTime: number;
  batchEndTime: number;
  batchSize: number;
  success: boolean;
  errorCount: number;
}

// Configuração otimizada com limite máximo da API (50 etiquetas por lote)
export const DEFAULT_CONFIG: ProcessingConfig = {
  delayBetweenBatches: 1000, // 1000ms delay
  labelsPerBatch: 50, // Máximo permitido pela API
  maxRetries: 3,
  fallbackDelay: 3000, // Original delay for fallback
};

// Configuração específica para A4 com máximo da API
export const A4_CONFIG: ProcessingConfig = {
  delayBetweenBatches: 1000, // 1000ms delay
  labelsPerBatch: 50, // Máximo permitido pela API
  maxRetries: 3,
  fallbackDelay: 2500, // Slightly faster fallback for A4
};

// Configuração rápida com máximo da API
export const FAST_CONFIG: ProcessingConfig = {
  delayBetweenBatches: 800,
  labelsPerBatch: 50, // Máximo permitido pela API
  maxRetries: 2,
  fallbackDelay: 2000,
};

export class ProcessingMetricsTracker {
  private metrics: ProcessingMetrics[] = [];
  private errorRate = 0;
  private currentConfig: ProcessingConfig;

  constructor(initialConfig: ProcessingConfig = DEFAULT_CONFIG) {
    this.currentConfig = initialConfig;
  }

  startBatch(batchSize: number): number {
    const startTime = Date.now();
    console.log(`🚀 Starting batch of ${batchSize} labels at ${new Date(startTime).toISOString()}`);
    return startTime;
  }

  endBatch(startTime: number, batchSize: number, success: boolean, errorCount: number = 0) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const metric: ProcessingMetrics = {
      batchStartTime: startTime,
      batchEndTime: endTime,
      batchSize,
      success,
      errorCount,
    };
    
    this.metrics.push(metric);
    this.updateErrorRate();
    
    console.log(`✅ Batch completed in ${duration}ms | Success: ${success} | Errors: ${errorCount}`);
    console.log(`📊 Current error rate: ${(this.errorRate * 100).toFixed(1)}%`);
    
    return metric;
  }

  private updateErrorRate() {
    if (this.metrics.length === 0) return;
    
    const recentMetrics = this.metrics.slice(-10); // Last 10 batches
    const errorCount = recentMetrics.filter(m => !m.success || m.errorCount > 0).length;
    this.errorRate = errorCount / recentMetrics.length;
  }

  shouldUseFallback(): boolean {
    return this.errorRate > 0.3; // If more than 30% error rate
  }

  getAverageProcessingTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalTime = this.metrics.reduce((sum, metric) => {
      return sum + (metric.batchEndTime - metric.batchStartTime);
    }, 0);
    
    return totalTime / this.metrics.length;
  }

  getCurrentConfig(): ProcessingConfig {
    return this.currentConfig;
  }

  updateConfig(newConfig: ProcessingConfig) {
    console.log(`🔧 Updating processing config:`, {
      old: this.currentConfig,
      new: newConfig,
    });
    this.currentConfig = newConfig;
  }

  getProcessingStats() {
    const totalBatches = this.metrics.length;
    const successfulBatches = this.metrics.filter(m => m.success).length;
    const totalLabels = this.metrics.reduce((sum, m) => sum + m.batchSize, 0);
    const averageTime = this.getAverageProcessingTime();
    
    return {
      totalBatches,
      successfulBatches,
      totalLabels,
      averageTime,
      errorRate: this.errorRate,
      estimatedTimePerLabel: totalLabels > 0 ? averageTime / (totalLabels / totalBatches) : 0,
    };
  }

  logPerformanceReport() {
    const stats = this.getProcessingStats();
    console.log(`📈 Performance Report:`, {
      ...stats,
      config: this.currentConfig,
    });
  }
}
