import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';
import { InboxListComponent } from './inbox/inbox-list/inbox-list.component';
import { ContactsComponent } from './components/contacts/contacts.component';
import { LoginComponent } from './loginpage/login/login.component';
import { SignupComponent } from './loginpage/signup/signup.component';
import { TrashListComponent } from "./inbox/trash-list/trash-list.component";
import { FoldersPageComponent } from './components/folders-page/folders-page.component';
import { FolderViewComponent } from './components/folder-view/folder-view.component';
import { PriorityInboxComponent } from "./inbox/priority-inbox/priority-inbox.component";
import { SentListComponent } from "./inbox/sent-list/sent-list.component";
import { DraftListComponent } from "./inbox/draft-list/draft-list.component";
import { SettingsComponent } from "./components/settings/settings.component"
import {NotFoundComponent} from "./components/not-found/not-found.component";
import { StarredListComponent } from "./inbox/starred-list/starred-list.component"; // ADD THIS LINE


export const routes: Routes = [
  // Default route goes to login page
  { path: '', redirectTo: 'inbox', pathMatch: 'full' },

  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // Protected Shell section
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'inbox', component: InboxListComponent },
      { path: 'priority', component: PriorityInboxComponent },
      { path: 'sent', component: SentListComponent },
      { path: 'drafts', component: DraftListComponent },
      { path: 'trash', component: TrashListComponent },
      { path: 'starred', component: StarredListComponent },
      { path: 'contacts', component: ContactsComponent },
      { path: 'folders', component: FoldersPageComponent },
      { path: 'folder/:id', component: FolderViewComponent },
      { path: 'settings', component: SettingsComponent }, // Added settings route
    ],
  },

  // Unknown routes → Login
  { path: '**', component:NotFoundComponent },
];
