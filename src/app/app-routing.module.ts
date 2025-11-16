import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProgressTrackerComponent } from './components/progress-tracker/progress-tracker.component';
import { CodeSnippetsComponent } from './components/code-snippets/code-snippets.component';
import { ExamsComponent } from './components/exams/exams.component';

const routes: Routes = [
  { path: '', redirectTo: '/progress', pathMatch: 'full' },
  { path: 'progress', component: ProgressTrackerComponent },
  { path: 'code-snippets', component: CodeSnippetsComponent },
  { path: 'exams', component: ExamsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
