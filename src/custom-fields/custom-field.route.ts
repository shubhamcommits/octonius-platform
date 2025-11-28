import { Router } from 'express'
import { CustomFieldController } from './custom-field.controller'
import { CustomFieldService } from './custom-field.service'
import { verifyAccessToken } from '../middleware/auth.middleware'

export class CustomFieldRoute {
    public router: Router
    private customFieldService: CustomFieldService
    private customFieldController: CustomFieldController

    constructor() {
        this.router = Router()
        this.customFieldService = new CustomFieldService()
        this.customFieldController = new CustomFieldController(this.customFieldService)
        this.initializeRoutes()
    }

    private initializeRoutes(): void {
        // Apply authentication middleware to all routes
        this.router.use(verifyAccessToken)

        // Group Custom Field Definition Routes
        this.router.post(
            '/groups/:group_id/custom-field-definitions',
            this.customFieldController.createGroupFieldDefinition.bind(this.customFieldController)
        )

        this.router.get(
            '/groups/:group_id/custom-field-definitions',
            this.customFieldController.getGroupFieldDefinitions.bind(this.customFieldController)
        )

        this.router.put(
            '/custom-field-definitions/:field_id',
            this.customFieldController.updateGroupFieldDefinition.bind(this.customFieldController)
        )

        this.router.delete(
            '/custom-field-definitions/:field_id',
            this.customFieldController.deleteGroupFieldDefinition.bind(this.customFieldController)
        )

        // Task Custom Field Routes
        this.router.post(
            '/tasks/:task_id/custom-fields',
            this.customFieldController.upsertTaskCustomField.bind(this.customFieldController)
        )

        this.router.get(
            '/tasks/:task_id/custom-fields',
            this.customFieldController.getTaskCustomFields.bind(this.customFieldController)
        )

        this.router.delete(
            '/custom-fields/:field_id',
            this.customFieldController.deleteTaskCustomField.bind(this.customFieldController)
        )

        this.router.put(
            '/tasks/:task_id/custom-fields/reorder',
            this.customFieldController.reorderTaskCustomFields.bind(this.customFieldController)
        )

        // Group Templates for Task Creation
        this.router.get(
            '/groups/:group_id/custom-field-templates',
            this.customFieldController.getGroupTemplatesForTaskCreation.bind(this.customFieldController)
        )
    }
}
