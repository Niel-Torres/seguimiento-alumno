import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProgressTrackerComponent } from './components/progress-tracker/progress-tracker.component';
import { CodeSnippetsComponent } from './components/code-snippets/code-snippets.component';
import { ExamsComponent } from './components/exams/exams.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'progress', component: ProgressTrackerComponent, canActivate: [AuthGuard] },
  { path: 'code-snippets', component: CodeSnippetsComponent, canActivate: [AuthGuard] },
  { path: 'exams', component: ExamsComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
