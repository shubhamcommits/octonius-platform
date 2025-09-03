import { Op } from 'sequelize'
import { Task, TaskAssignee, Group, User, TaskColumn } from '../models'
import logger from '../logger'

export interface WorkloadStats {
    total: number
    overdue: number
    todo: number
    inProgress: number
    done: number
}

export interface WorkloadActivity {
    id: string
    user: string
    action: string
    item: string
    time: string
    team: string
    avatar: string
}

export interface WorkloadMessage {
    id: string
    user: string
    message: string
    time: string
    team: string
    avatar: string
}

export interface WorkloadNews {
    id: string
    user: string
    news: string
    time: string
    avatar: string
}

export interface WorkloadData {
    stats: WorkloadStats
    today: any[]
    tomorrow: any[]
    thisWeek: any[]
    nextWeek: any[]
    activity: WorkloadActivity[]
    messages: WorkloadMessage[]
    news: WorkloadNews[]
}

export interface PaginatedTasks {
    tasks: any[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export class WorkloadService {
    /**
     * Get workload data for a user in a workplace
     * This includes tasks assigned to the user from all groups in the workplace
     */
    async getWorkload(userId: string, workplaceId: string): Promise<WorkloadData> {
        try {
            // Get all tasks assigned to the user in this workplace from all groups
            const tasks = await Task.findAll({
                include: [
                    {
                        model: TaskAssignee,
                        as: 'task_assignees',
                        where: { user_id: userId },
                        required: true
                    },
                    {
                        model: Group,
                        as: 'group',
                        where: { workplace_id: workplaceId },
                        required: true,
                        attributes: ['uuid', 'name']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url']
                    },
                    {
                        model: TaskColumn,
                        as: 'column',
                        attributes: ['uuid', 'name', 'color']
                    }
                ],
                order: [
                    ['due_date', 'ASC'],
                    ['created_at', 'DESC']
                ]
            })

            logger.info('Workload tasks fetched', { 
                userId, 
                workplaceId, 
                totalTasks: tasks.length,
                groups: [...new Set(tasks.map((task: any) => task.group?.name))],
                tasksWithDueDates: tasks.filter((task: any) => task.due_date).length
            })
            // Calculate date ranges
            const now = new Date()
            const today = new Date(now)
            today.setHours(0, 0, 0, 0)
            
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            const nextWeek = new Date(today)
            nextWeek.setDate(nextWeek.getDate() + 7)
          
            // Filter tasks by due date - ensure we get tasks from all groups
            // Include overdue tasks in today's list since they are due ASAP
            const overdueTasks = tasks.filter(task => {
                if (!task.due_date || task.status === 'done') return false
                const taskDate = new Date(task.due_date)
                taskDate.setHours(0, 0, 0, 0)
                return taskDate < today
            })

            const todayTasks = tasks.filter(task => {
                if (!task.due_date) return false
                const taskDate = new Date(task.due_date)
                taskDate.setHours(0, 0, 0, 0) // Normalize to start of day
                return taskDate.getTime() === today.getTime()
            })

            // Combine today's tasks with overdue tasks
            const todayAndOverdueTasks = [...overdueTasks, ...todayTasks]

            const tomorrowTasks = tasks.filter(task => {
                if (!task.due_date) return false
                const taskDate = new Date(task.due_date)
                taskDate.setHours(0, 0, 0, 0) // Normalize to start of day
                const tomorrowDate = new Date(today)
                tomorrowDate.setDate(tomorrowDate.getDate() + 1)
                return taskDate.getTime() === tomorrowDate.getTime()
            })

            const thisWeekTasks = tasks.filter(task => {
                if (!task.due_date) return false
                const taskDate = new Date(task.due_date)
                taskDate.setHours(0, 0, 0, 0) // Normalize to start of day
                const thisWeekStart = new Date(today)
                thisWeekStart.setDate(thisWeekStart.getDate() + 2) // Start from day after tomorrow
                const thisWeekEnd = new Date(today)
                thisWeekEnd.setDate(thisWeekEnd.getDate() + 7) // End of this week
                return taskDate >= thisWeekStart && taskDate < thisWeekEnd
            })

            const nextWeekTasks = tasks.filter(task => {
                if (!task.due_date) return false
                const taskDate = new Date(task.due_date)
                taskDate.setHours(0, 0, 0, 0) // Normalize to start of day
                const nextWeekStart = new Date(today)
                nextWeekStart.setDate(nextWeekStart.getDate() + 8) // Start from next week
                const nextWeekEnd = new Date(today)
                nextWeekEnd.setDate(nextWeekEnd.getDate() + 15) // End of next week
                return taskDate >= nextWeekStart && taskDate < nextWeekEnd
            })

            // Calculate stats - ensure we count tasks from all groups
            const stats: WorkloadStats = {
                total: todayAndOverdueTasks.length, // Today's tasks + overdue tasks
                overdue: overdueTasks.length,
                todo: tasks.filter(task => task.status === 'todo').length,
                inProgress: tasks.filter(task => task.status === 'in_progress').length,
                done: tasks.filter(task => task.status === 'done').length
            }

            // Format tasks for frontend
            const formatTask = (task: any) => {
                const taskWithAssociations = task as any
                return {
                    id: task.uuid,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.due_date,
                    startDate: task.start_date,
                    team: taskWithAssociations.group?.name || 'Team',
                    group: taskWithAssociations.group?.name,
                    group_id: taskWithAssociations.group?.uuid,
                    column: taskWithAssociations.column?.name,
                    creator: taskWithAssociations.creator,
                    assignees: taskWithAssociations.task_assignees?.map((ta: any) => ta.user_id) || [],
                    color: task.color,
                    labels: task.labels,
                    created_at: task.created_at,
                    updated_at: task.updated_at
                }
            }

            // Mock activity data (in a real app, this would come from activity logs)
            const activity: WorkloadActivity[] = tomorrowTasks.slice(0, 5).map((task: any, index: number) => {
                const taskWithAssociations = task as any
                return {
                    id: `activity-${index}`,
                    user: taskWithAssociations.creator?.first_name || 'Someone',
                    action: 'assigned you',
                    item: task.title,
                    time: '2 hours ago',
                    team: taskWithAssociations.group?.name || 'Team',
                    avatar: taskWithAssociations.creator?.first_name?.charAt(0) || 'U'
                }
            })

            // Mock messages (in a real app, this would come from messaging system)
            const messages: WorkloadMessage[] = []

            // Mock news (in a real app, this would come from lounge/news system)
            const news: WorkloadNews[] = []
            logger.info('Workload data processed', { 
                todayTasks: todayTasks.length,
                overdueTasks: overdueTasks.length,
                todayAndOverdueTasks: todayAndOverdueTasks.length,
                tomorrowTasks: tomorrowTasks.length,
                thisWeekTasks: thisWeekTasks.length,
                nextWeekTasks: nextWeekTasks.length,
                stats
            })

            // Limit initial load to 5 tasks per section for better performance
            const limitInitialTasks = (tasks: any[]) => tasks.slice(0, 5).map(formatTask);

            return {
                stats,
                today: limitInitialTasks(todayAndOverdueTasks),
                tomorrow: limitInitialTasks(tomorrowTasks),
                thisWeek: limitInitialTasks(thisWeekTasks),
                nextWeek: limitInitialTasks(nextWeekTasks),
                activity,
                messages,
                news
            }
        } catch (error) {
            logger.error('Error fetching workload', { error, userId, workplaceId })
            throw error
        }
    }

    /**
     * Get paginated tasks for a specific section
     */
    async getPaginatedTasks(
        userId: string, 
        workplaceId: string, 
        section: 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek',
        page: number = 1,
        limit: number = 5
    ): Promise<PaginatedTasks> {
        try {
            // Get all tasks for the user in this workplace
            const tasks = await Task.findAll({
                include: [
                    {
                        model: TaskAssignee,
                        as: 'task_assignees',
                        where: { user_id: userId },
                        required: true
                    },
                    {
                        model: Group,
                        as: 'group',
                        where: { workplace_id: workplaceId },
                        required: true,
                        attributes: ['uuid', 'name']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['uuid', 'first_name', 'last_name', 'avatar_url']
                    },
                    {
                        model: TaskColumn,
                        as: 'column',
                        attributes: ['uuid', 'name', 'color']
                    }
                ],
                order: [
                    ['due_date', 'ASC'],
                    ['created_at', 'DESC']
                ]
            })

            // Calculate date ranges
            const now = new Date()
            const today = new Date(now)
            today.setHours(0, 0, 0, 0)

            let filteredTasks: any[] = []

            switch (section) {
                case 'today':
                    const overdueTasks = tasks.filter(task => {
                        if (!task.due_date || task.status === 'done') return false
                        const taskDate = new Date(task.due_date)
                        taskDate.setHours(0, 0, 0, 0)
                        return taskDate < today
                    })
                    const todayTasks = tasks.filter(task => {
                        if (!task.due_date) return false
                        const taskDate = new Date(task.due_date)
                        taskDate.setHours(0, 0, 0, 0)
                        return taskDate.getTime() === today.getTime()
                    })
                    filteredTasks = [...overdueTasks, ...todayTasks]
                    break

                case 'tomorrow':
                    const tomorrowDate = new Date(today)
                    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
                    filteredTasks = tasks.filter(task => {
                        if (!task.due_date) return false
                        const taskDate = new Date(task.due_date)
                        taskDate.setHours(0, 0, 0, 0)
                        return taskDate.getTime() === tomorrowDate.getTime()
                    })
                    break

                case 'thisWeek':
                    const thisWeekStart = new Date(today)
                    thisWeekStart.setDate(thisWeekStart.getDate() + 2)
                    const thisWeekEnd = new Date(today)
                    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
                    filteredTasks = tasks.filter(task => {
                        if (!task.due_date) return false
                        const taskDate = new Date(task.due_date)
                        taskDate.setHours(0, 0, 0, 0)
                        return taskDate >= thisWeekStart && taskDate < thisWeekEnd
                    })
                    break

                case 'nextWeek':
                    const nextWeekStart = new Date(today)
                    nextWeekStart.setDate(nextWeekStart.getDate() + 8)
                    const nextWeekEnd = new Date(today)
                    nextWeekEnd.setDate(nextWeekEnd.getDate() + 15)
                    filteredTasks = tasks.filter(task => {
                        if (!task.due_date) return false
                        const taskDate = new Date(task.due_date)
                        taskDate.setHours(0, 0, 0, 0)
                        return taskDate >= nextWeekStart && taskDate < nextWeekEnd
                    })
                    break
            }

            // Format tasks
            const formatTask = (task: any) => {
                const taskWithAssociations = task as any
                return {
                    id: task.uuid,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.due_date,
                    startDate: task.start_date,
                    team: taskWithAssociations.group?.name || 'Team',
                    group: taskWithAssociations.group?.name,
                    group_id: taskWithAssociations.group?.uuid,
                    column: taskWithAssociations.column?.name,
                    creator: taskWithAssociations.creator,
                    assignees: taskWithAssociations.task_assignees?.map((ta: any) => ta.user_id) || [],
                    color: task.color,
                    labels: task.labels,
                    created_at: task.created_at,
                    updated_at: task.updated_at
                }
            }

            const formattedTasks = filteredTasks.map(formatTask)
            const total = formattedTasks.length
            const totalPages = Math.ceil(total / limit)
            const offset = (page - 1) * limit
            const paginatedTasks = formattedTasks.slice(offset, offset + limit)

            return {
                tasks: paginatedTasks,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        } catch (error) {
            logger.error('Error fetching paginated tasks', { error, userId, workplaceId, section, page, limit })
            throw error
        }
    }
} 