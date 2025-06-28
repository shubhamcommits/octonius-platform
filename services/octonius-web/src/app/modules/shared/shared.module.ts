import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LucideAngularModule, 
  Home, 
  User, 
  LogIn, 
  LogOut, 
  SunMoon, 
  Plus, 
  Upload, 
  UploadCloud, 
  Menu, 
  Search, 
  ListFilter, 
  ArrowUpDown, 
  FilePlus, 
  FileText, 
  File, 
  Folder, 
  FileSpreadsheet as FileKeynote, 
  Paperclip, 
  MessageSquare, 
  MoreHorizontal, 
  Heart,
  Calendar,
  Clock,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  AtSign,
  Bell,
  Settings,
  LayoutDashboard,
  CheckSquare,
  List,
  LayoutGrid,
  BarChart3,
  Zap,
  Filter,
  X,
  MessageSquareText,
  MapPin,
  Users,
  RefreshCw
} from 'lucide-angular'
import { AuthGuard } from './services/auth.guard'
import { NonAuthGuard } from './services/non-auth.guard'
import { NavbarComponent } from './components/navbar/navbar.component'
import { TopbarComponent } from './components/topbar/topbar.component'

@NgModule({
  imports: [
    CommonModule,
    TopbarComponent,
    NavbarComponent,
    NgxSkeletonLoaderModule.forRoot({
      animation: 'progress',
      loadingText: 'Getting you up to speed...',
      theme: {
        extendsFromRoot: true,
        width: '100%',          // full-width bars
        height: '10px',         // nice slim lines
        borderRadius: '9999px', // fully pill-shaped ends
        backgroundColor: '#D1D5DB',   // your gray-300 base
        highlightColor:  '#E5E7EB',   // gray-200 shimmer
        highlightWidth:  '30%',       // narrow, refined shimmer band
      }
    }),
    LucideAngularModule.pick({ 
      Home, 
      User, 
      LogIn, 
      LogOut, 
      SunMoon, 
      Plus, 
      Upload, 
      UploadCloud, 
      Menu, 
      Search, 
      ListFilter, 
      ArrowUpDown, 
      FilePlus, 
      FileText, 
      File, 
      Folder, 
      FileKeynote, 
      Paperclip, 
      MessageSquare, 
      MoreHorizontal, 
      Heart,
      Calendar,
      Clock,
      Check,
      CheckCircle,
      ChevronLeft,
      ChevronRight,
      ChevronUp,
      ChevronDown,
      AtSign,
      Bell,
      Settings,
      LayoutDashboard,
      CheckSquare,
      List,
      LayoutGrid,
      BarChart3,
      Zap,
      Filter,
      X,
      MessageSquareText,
      MapPin,
      Users,
      RefreshCw
    })
  ],
  exports: [
    CommonModule,
    LucideAngularModule,
    TopbarComponent,
    NavbarComponent,
    NgxSkeletonLoaderModule
  ],
  providers: [AuthGuard, NonAuthGuard]
})
export class SharedModule { }
