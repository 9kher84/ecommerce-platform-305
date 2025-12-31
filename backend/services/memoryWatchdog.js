const os = require('os');
const debug = require('debug')('app:watchdog');

const MEMORY_THRESHOLD_PERCENT = 80;
const CHECK_INTERVAL_MS = 10000; // Check every 10 seconds

/**
 * Sovereign Memory Watchdog
 * Monitors RSS and Heap usage. Alerts if usage > 80% of system memory (or container limit).
 */
class MemoryWatchdog {
    constructor() {
        this.interval = null;
    }

    start() {
        console.log('🛡️  Memory Watchdog Activated.');
        this.interval = setInterval(() => {
            this.checkMemory();
        }, CHECK_INTERVAL_MS);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }

    checkMemory() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const usagePercent = (usedMem / totalMem) * 100;

        const processMemory = process.memoryUsage();
        const rssMB = Math.round(processMemory.rss / 1024 / 1024);
        const heapUsedMB = Math.round(processMemory.heapUsed / 1024 / 1024);

        // console.log(`[Watchdog] System: ${usagePercent.toFixed(1)}% | RSS: ${rssMB}MB | Heap: ${heapUsedMB}MB`);

        if (usagePercent > MEMORY_THRESHOLD_PERCENT) {
            this.alert(`⚠️ HIGH MEMORY ALERT: System usage at ${usagePercent.toFixed(1)}%! RSS: ${rssMB}MB`);
            // In a real sovereign system, we might trigger GC or reject new requests here
            if (global.gc) {
                console.log('🧹 Triggering Emergency GC...');
                global.gc();
            }
        }

        // Heap Protection (Node default limit ~2GB or 4GB)
        // If heap is growing uncontrollably, log specialized alert
        if (heapUsedMB > 3000) {
            this.alert(`🚨 CRITICAL HEAP: ${heapUsedMB}MB. Risk of OOM Crash.`);
        }
    }

    alert(message) {
        console.error(message);
        // Future: Slack/Email Integration
    }
}

module.exports = new MemoryWatchdog();
