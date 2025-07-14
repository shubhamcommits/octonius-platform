import { circuitBreakerService, CIRCUIT_BREAKER_CONFIGS, type CircuitBreakerStats } from './circuit-breaker.service';
import { NotificationService } from '../../notifications/notification.service';
import { appLogger } from '../../logger';

interface EmailQueueItem {
    template: string;
    data: any;
    retryCount: number;
    createdAt: Date;
}

export class EmailCircuitBreakerService {
    private emailBreaker: any;
    private notificationService: NotificationService;
    private emailQueue: EmailQueueItem[] = [];
    private isProcessingQueue: boolean = false;

    constructor() {
        this.notificationService = new NotificationService();
        this.initializeCircuitBreaker();
        
        // Start processing queue every 30 seconds
        setInterval(() => {
            this.processEmailQueue();
        }, 30000);
    }

    private initializeCircuitBreaker() {
        this.emailBreaker = circuitBreakerService.createBreaker(
            this.executeEmailSend.bind(this),
            {
                ...CIRCUIT_BREAKER_CONFIGS.EMAIL_SERVICE,
                name: 'EMAIL_SERVICE',
                fallback: (template: string, data: any) => {
                    appLogger('Email service fallback - adding to queue', { 
                        level: 'warn',
                        template,
                        recipient: data.email
                    });
                    
                    this.addToQueue(template, data);
                    return { 
                        success: false, 
                        message: 'Email queued for retry due to service unavailability',
                        queued: true 
                    };
                }
            }
        );
    }

    /**
     * Send email with circuit breaker protection
     */
    async sendEmail(template: string, data: any): Promise<{ success: boolean; message: string; queued?: boolean }> {
        try {
            const result = await this.emailBreaker.fire(template, data);
            
            // If successful, log it
            if (result.success) {
                appLogger('Email sent successfully through circuit breaker', {
                    level: 'info',
                    template,
                    recipient: data.email
                });
            }
            
            return result;
        } catch (error) {
            appLogger('Email sending failed through circuit breaker', {
                level: 'error',
                template,
                recipient: data.email,
                error: error instanceof Error ? error.message : String(error)
            });
            
            // Add to queue for retry
            this.addToQueue(template, data);
            
            return { 
                success: false, 
                message: 'Email service temporarily unavailable. Email queued for retry.',
                queued: true 
            };
        }
    }

    /**
     * Send multiple emails with circuit breaker protection
     */
    async sendBulkEmails(emails: Array<{ template: string; data: any }>): Promise<{
        successful: number;
        failed: number;
        queued: number;
        results: Array<{ success: boolean; message: string; queued?: boolean }>;
    }> {
        const results = [];
        let successful = 0;
        let failed = 0;
        let queued = 0;

        for (const email of emails) {
            try {
                const result = await this.sendEmail(email.template, email.data);
                results.push(result);
                
                if (result.success) {
                    successful++;
                } else if (result.queued) {
                    queued++;
                } else {
                    failed++;
                }
                
                // Small delay between emails to prevent overwhelming the service
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.push({ 
                    success: false, 
                    message: 'Email processing failed',
                    queued: true 
                });
                failed++;
            }
        }

        appLogger('Bulk email sending completed', {
            level: 'info',
            total: emails.length,
            successful,
            failed,
            queued
        });

        return { successful, failed, queued, results };
    }

    /**
     * Add email to retry queue
     */
    private addToQueue(template: string, data: any): void {
        const existingItem = this.emailQueue.find(
            item => item.template === template && item.data.email === data.email
        );

        if (existingItem) {
            // Update retry count for existing item
            existingItem.retryCount += 1;
            existingItem.createdAt = new Date();
        } else {
            // Add new item to queue
            this.emailQueue.push({
                template,
                data,
                retryCount: 1,
                createdAt: new Date()
            });
        }

        appLogger('Email added to retry queue', {
            level: 'info',
            template,
            recipient: data.email,
            queueLength: this.emailQueue.length
        });
    }

    /**
     * Process emails in the retry queue
     */
    private async processEmailQueue(): Promise<void> {
        if (this.isProcessingQueue || this.emailQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        appLogger('Processing email queue', { 
            level: 'info',
            queueLength: this.emailQueue.length 
        });

        const itemsToProcess = [...this.emailQueue];
        this.emailQueue = [];

        for (const item of itemsToProcess) {
            try {
                // Don't retry items that are too old (older than 24 hours) or have too many retries
                const isExpired = Date.now() - item.createdAt.getTime() > 24 * 60 * 60 * 1000;
                const tooManyRetries = item.retryCount > 5;

                if (isExpired || tooManyRetries) {
                    appLogger('Dropping email from queue', {
                        level: 'warn',
                        template: item.template,
                        recipient: item.data.email,
                        reason: isExpired ? 'expired' : 'too_many_retries',
                        retryCount: item.retryCount
                    });
                    continue;
                }

                // Try to send the email
                const result = await this.executeEmailSend(item.template, item.data);
                
                if (result.success) {
                    appLogger('Queued email sent successfully', {
                        level: 'info',
                        template: item.template,
                        recipient: item.data.email,
                        retryCount: item.retryCount
                    });
                } else {
                    // Re-add to queue if still failing
                    this.addToQueue(item.template, item.data);
                }

                // Small delay between processing items
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                appLogger('Error processing queued email', {
                    level: 'error',
                    template: item.template,
                    recipient: item.data.email,
                    error: error instanceof Error ? error.message : String(error)
                });
                
                // Re-add to queue for retry
                this.addToQueue(item.template, item.data);
            }
        }

        this.isProcessingQueue = false;
        appLogger('Email queue processing completed', { 
            level: 'info',
            remainingInQueue: this.emailQueue.length 
        });
    }

    /**
     * Execute actual email sending
     */
    private async executeEmailSend(template: string, data: any): Promise<{ success: boolean; message: string }> {
        try {
            const result = await this.notificationService.sendMail(template, data);
            return { success: true, message: result.message };
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }

    /**
     * Get email queue status
     */
    getQueueStatus(): {
        queueLength: number;
        isProcessing: boolean;
        oldestItem?: Date;
        newestItem?: Date;
    } {
        const status = {
            queueLength: this.emailQueue.length,
            isProcessing: this.isProcessingQueue,
            oldestItem: undefined as Date | undefined,
            newestItem: undefined as Date | undefined
        };

        if (this.emailQueue.length > 0) {
            const dates = this.emailQueue.map(item => item.createdAt);
            status.oldestItem = new Date(Math.min(...dates.map(d => d.getTime())));
            status.newestItem = new Date(Math.max(...dates.map(d => d.getTime())));
        }

        return status;
    }

    /**
     * Clear email queue (use carefully)
     */
    clearQueue(): void {
        const clearedCount = this.emailQueue.length;
        this.emailQueue = [];
        appLogger('Email queue cleared', { 
            level: 'warn',
            clearedCount 
        });
    }

    /**
     * Get circuit breaker statistics
     */
    getCircuitBreakerStats(): CircuitBreakerStats | null {
        return circuitBreakerService.getBreakerStats('EMAIL_SERVICE');
    }

    /**
     * Force circuit breaker to open (for testing)
     */
    forceOpen(): void {
        const breaker = circuitBreakerService.getBreaker('EMAIL_SERVICE');
        if (breaker) {
            breaker.open();
            appLogger('Email circuit breaker forced open', { level: 'warn' });
        }
    }

    /**
     * Force circuit breaker to close (for testing)
     */
    forceClose(): void {
        const breaker = circuitBreakerService.getBreaker('EMAIL_SERVICE');
        if (breaker) {
            breaker.close();
            appLogger('Email circuit breaker forced closed', { level: 'info' });
        }
    }
} 