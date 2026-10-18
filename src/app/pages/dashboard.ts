import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { TPipe } from '../core/i18n';
import { Appointment, fmtDT, statusClass, todayStr } from '../core/models';

interface Stat { num: string | number; label: string; }

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, TPipe],
  template: `
    <div class="grid-stats">
      @for (s of stats(); track s.label) {
        <div class="stat"><div class="num">{{ s.num }}</div><div class="lbl">{{ s.label | t }}</div></div>
      }
    </div>

    <div class="panel">
      <div class="panel-head">
        <div><h2>{{ (role === 'PATIENT' ? 'd.upcoming' : 'd.todayList') | t }}</h2></div>
        @if (role === 'PATIENT') { <a class="btn btn-primary" style="text-decoration:none" routerLink="/app/book">{{ 'd.bookNew' | t }}</a> }
      </div>
      <table>
        <thead><tr>
          @if (role !== 'PATIENT') { <th>{{ 'a.patient' | t }}</th> }
          @if (role !== 'DOCTOR') { <th>{{ 'a.doctor' | t }}</th> }
          <th>{{ 'a.dateTime' | t }}</th><th>{{ 'a.reason' | t }}</th><th>{{ 'c.status' | t }}</th>
        </tr></thead>
        <tbody>
          @for (a of list(); track a.id) {
            <tr>
              @if (role !== 'PATIENT') { <td class="cell-main">{{ a.patientName }}</td> }
              @if (role !== 'DOCTOR') { <td [class.cell-main]="role === 'PATIENT'">{{ a.doctorName }}</td> }
              <td><bdi dir="ltr">{{ fmt(a.appointmentDateTime) }}</bdi></td><td>{{ a.reasonForVisit }}</td>
              <td><span [class]="'pill ' + cls(a.status)">{{ 'st.' + a.status | t }}</span></td>
            </tr>
          }
        </tbody>
      </table>
      @if (!list().length) { <div class="empty">{{ (loading() ? 'c.loading' : (role === 'PATIENT' ? 'd.noNext' : 'd.noToday')) | t }}</div> }
    </div>`,
})
export class DashboardPage implements OnInit {
  private api = inject(Api);
  private auth = inject(Auth);
  role = this.auth.role()!;
  fmt = fmtDT;
  cls = statusClass;
  stats = signal<Stat[]>([]);
  list = signal<Appointment[]>([]);
  loading = signal(true);

  ngOnInit() {
    const id = this.auth.session()!.id;
    const today = todayStr();
    const now = new Date().toISOString().slice(0, 16);
    const done = () => this.loading.set(false);

    if (this.role === 'ADMIN') {
      const one = { page: 0, size: 1 };
      forkJoin({
        d: this.api.doctors(one), p: this.api.patients(one), s: this.api.specializations(),
        // needs the fixed GET /api/appointments (backend-changes/); the other stats still load without it
        a: this.api.appointments({ page: 0, size: 10, sortBy: 'appointmentDateTime', direction: 'asc', start: today + 'T00:00:00', end: today + 'T23:59:59' })
          .pipe(catchError(() => of(null))),
      }).subscribe({
        next: ({ d, p, s, a }) => {
          this.stats.set([
            { num: d.totalElements, label: 'd.doctors' }, { num: p.totalElements, label: 'd.patients' },
            { num: a ? a.totalElements : '—', label: 'd.today' }, { num: s.length, label: 'd.specs' },
          ]);
          this.list.set(a?.content ?? []);
          done();
        },
        error: done,
      });
    } else if (this.role === 'DOCTOR') {
      forkJoin({ a: this.api.allDoctorAppointments(id), av: this.api.availabilities() }).subscribe({
        next: ({ a, av }) => {
          const todays = a.filter((x) => x.appointmentDateTime.startsWith(today)).sort((x, y) => x.appointmentDateTime.localeCompare(y.appointmentDateTime));
          this.stats.set([
            { num: todays.length, label: 'd.today' },
            { num: new Set(a.map((x) => x.patientID)).size, label: 'd.myPatients' },
            { num: a.filter((x) => x.status === 'PENDING').length, label: 'd.pending' },
            { num: av.filter((x) => x.doctorID === id).length, label: 'd.slots' },
          ]);
          this.list.set(todays);
          done();
        },
        error: done,
      });
    } else {
      forkJoin({ a: this.api.allPatientAppointments(id), rx: this.api.patientPrescriptions(id).pipe(catchError(() => of(null))) }).subscribe({
        next: ({ a, rx }) => {
          const upcoming = a
            .filter((x) => (x.status === 'PENDING' || x.status === 'CONFIRMED') && x.appointmentDateTime >= now)
            .sort((x, y) => x.appointmentDateTime.localeCompare(y.appointmentDateTime));
          this.stats.set([
            { num: upcoming[0] ? fmtDT(upcoming[0].appointmentDateTime).slice(5) : '—', label: 'd.next' },
            { num: upcoming.length, label: 'd.upcoming' },
            { num: rx ? rx.length : '—', label: 'd.rx' },
            { num: a.filter((x) => x.status === 'COMPLETED').length, label: 'd.past' },
          ]);
          this.list.set(upcoming);
          done();
        },
        error: done,
      });
    }
  }
}
