import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

interface Task {
  id: string;
  title: string;
  labels: { text: string; color: string }[];
  assignee: { name: string; avatar: string };
  dueDate: Date;
  color: string;
  done: boolean;
}

interface Column {
  id: string;
  name: string;
  tasks: Task[];
}

interface Board {
  columns: Column[];
}

@Component({
  selector: 'app-group-tasks',
  standalone: false,
  templateUrl: './group-tasks.component.html',
  styleUrl: './group-tasks.component.scss'
})
export class GroupTasksComponent implements OnInit {

  board: Board | undefined;

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.board = {
      columns: [
        {
          id: 'col1',
          name: 'Untitled section',
          tasks: [
            { id: 'task1', title: 'Implement new color scheme for dashboard', labels: [{text: 'label 5', color: '#E53935'}, {text: 'label 6', color: '#8E24AA'}], assignee: { name: 'User 1', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' }, dueDate: new Date('2025-07-15'), color: '#757575', done: false },
            { id: 'task2', title: 'Create user onboarding tutorial video', labels: [{text: 'label 7', color: '#3949AB'}, {text: 'label 8', color: '#00897B'}], assignee: { name: 'User 2', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704b' }, dueDate: new Date('2025-08-01'), color: '#757575', done: false },
            { id: 'task3', title: 'Design interactive prototype for mobile app', labels: [{text: 'label 9', color: '#546E7A'}, {text: 'label 10', color: '#FDD835'}], assignee: { name: 'User 3', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704c' }, dueDate: new Date('2025-09-10'), color: '#757575', done: false },
          ]
        },
        {
          id: 'col2',
          name: 'Backlog',
          tasks: [
            { id: 'task4', title: 'Finalize prototype for project BETA', labels: [{text: 'custom field', color: '#FB8C00'}, {text: 'label 2', color: '#43A047'}], assignee: { name: 'User 4', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }, dueDate: new Date('2025-06-10'), color: '#FBC02D', done: true },
            { id: 'task5', title: 'Conduct user testing for feature ALPHA', labels: [{text: 'custom field', color: '#FB8C00'}, {text: 'label 2', color: '#43A047'}], assignee: { name: 'User 1', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' }, dueDate: new Date('2025-06-12'), color: '#FBC02D', done: true },
            { id: 'task6', title: 'Prepare presentation for stakeholder review', labels: [{text: 'label 1', color: '#D81B60'}, {text: 'label 2', color: '#43A047'}], assignee: { name: 'User 5', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e' }, dueDate: new Date('2025-06-15'), color: '#FBC02D', done: false },
          ]
        },
        {
          id: 'col3',
          name: 'Review stage',
          tasks: [
            { id: 'task7', title: 'Gather feedback from initial mockups', labels: [{text: 'Custom field', color: '#FB8C00'}, {text: 'label 2', color: '#43A047'}], assignee: { name: 'User 1', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' }, dueDate: new Date('2025-07-01'), color: '#66BB6A', done: true },
            { id: 'task8', title: 'Revise designs based on user feedback', labels: [{text: 'custom field', color: '#FB8C00'}, {text: 'label 2', color: '#43A047'}], assignee: { name: 'User 1', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' }, dueDate: new Date('2025-07-03'), color: '#66BB6A', done: false },
            { id: 'task9', title: 'Finalize UI adjustments for project GAMMA', labels: [{text: 'label 1', color: '#D81B60'}, {text: 'label 2', color: '#43A047'}], assignee: { name: 'User 1', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a' }, dueDate: new Date('2025-07-05'), color: '#66BB6A', done: false },
          ]
        }
      ]
    };
  }

  getDoneTasks(column: Column): number {
    return column.tasks.filter(task => task.done).length;
  }

  onTaskClick(task: Task): void {
    this.router.navigate(['../tasks', task.id], { relativeTo: this.route });
  }
}
