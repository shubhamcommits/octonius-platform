// Import Required Modules
import { Router } from 'express'
import { GroupController } from './group.controller'
import { verifyAccessToken } from '../middleware/auth.middleware'

// Create Router Instance
const router = Router()

// Apply authentication middleware to all routes
router.use(verifyAccessToken)

/**
 * Group Routes
 * All routes are prefixed with /api/workplace/groups
 */

// Create a new work group
// POST /api/workplace/groups
router.post('/', GroupController.createGroup)

// Get all groups for a workplace
// GET /api/workplace/groups?workplace_id=uuid
router.get('/', GroupController.getGroups)

// Search groups by name
// GET /api/workplace/groups/search?workplace_id=uuid&q=search_term
router.get('/search', GroupController.searchGroups)

// Get a specific group by UUID
// GET /api/workplace/groups/:group_id
router.get('/:group_id', GroupController.getGroup)

// Update a group
// PUT /api/workplace/groups/:group_id
router.put('/:group_id', GroupController.updateGroup)

// Delete a group (soft delete)
// DELETE /api/workplace/groups/:group_id
router.delete('/:group_id', GroupController.deleteGroup)

// Add a member to a group
// POST /api/workplace/groups/:group_id/members
router.post('/:group_id/members', GroupController.addMember)

// Remove a member from a group
// DELETE /api/workplace/groups/:group_id/members/:user_id
router.delete('/:group_id/members/:user_id', GroupController.removeMember)

// Export Router
export default router 