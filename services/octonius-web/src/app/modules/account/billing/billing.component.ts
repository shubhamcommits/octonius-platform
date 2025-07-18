import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
    selector: 'app-billing',
    standalone: false,
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.scss']
})
export class BillingComponent {

    constructor(
        private authService: AuthService,
        private dialogService: DialogService
    ) { }

    // Placeholder for billing data
    plan = {
        name: 'Business Plan',
        price: '2000€',
        period: 'month',
        features: [
            'Unlimited users',
            'Priority support',
            'Advanced analytics',
            'Custom integrations'
        ]
    };

    manageBilling() {
        // Placeholder for billing management logic
        this.dialogService.alert({
            title: 'Coming Soon',
            message: 'Billing management will be available soon!',
            type: 'info'
        }).subscribe();
    }
} 