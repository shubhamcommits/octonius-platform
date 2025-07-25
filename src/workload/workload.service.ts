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
    nextWeek: any[]
    activity: WorkloadActivity[]
    messages: WorkloadMessage[]
    news: WorkloadNews[]
}

export class WorkloadService {
    /**
     * Get workload data for a user in a workplace
     * This includes tasks assigned to the user from all groups in the workplace
     */
    async getWorkload(userId: string, workplaceId: string): Promise<WorkloadData> {
        try {
            // Get all tasks assigned to the user in this workplace
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
            
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            const nextWeek = new Date(today)
            nextWeek.setDate(nextWeek.getDate() + 7)

            // Filter tasks by due date
            const todayTasks = tasks.filter(task => {
                if (!task.due_date) return false
                const taskDate = new Date(task.due_date)
                return taskDate >= today && taskDate < tomorrow
            })

            const tomorrowTasks = tasks.filter(task => {
                if (!task.due_date) return false
                const taskDate = new Date(task.due_date)
                return taskDate >= tomorrow && taskDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
            })

            const nextWeekTasks = tasks.filter(task => {
                if (!task.due_date) return false
                const taskDate = new Date(task.due_date)
                return taskDate >= tomorrow && taskDate < nextWeek
            })

            // Calculate stats
            const stats: WorkloadStats = {
                total: tasks.length,
                overdue: tasks.filter(task => task.due_date && task.due_date < now && task.status !== 'done').length,
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

            return {
                stats,
                today: todayTasks.map(formatTask),
                tomorrow: tomorrowTasks.map(formatTask),
                nextWeek: nextWeekTasks.map(formatTask),
                activity,
                messages,
                news
            }
        } catch (error) {
            logger.error('Error fetching workload', { error, userId, workplaceId })
            throw error
        }
    }
} 