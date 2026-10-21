import { Injectable, Pipe, PipeTransform, effect, inject, signal } from '@angular/core';

export type Lang = 'ar' | 'en';
type Entry = [ar: string, en: string];

const D: Record<string, Entry> = {
  // common
  'app.name': ['WellCare Clinic', 'WellCare Clinic'],
  'app.panel': ['لوحة التحكم', 'Control panel'],
  'c.save': ['حفظ', 'Save'], 'c.cancel': ['إلغاء', 'Cancel'], 'c.delete': ['حذف', 'Delete'], 'c.edit': ['تعديل', 'Edit'],
  'c.search': ['بحث بالاسم...', 'Search by name...'], 'c.loading': ['جاري التحميل...', 'Loading...'],
  'c.empty': ['مفيش بيانات لعرضها', 'Nothing to show yet'], 'c.name': ['الاسم', 'Name'], 'c.email': ['البريد الإلكتروني', 'Email'],
  'c.password': ['كلمة المرور', 'Password'], 'c.phone': ['رقم الهاتف', 'Phone number'], 'c.status': ['الحالة', 'Status'],
  'c.allStatuses': ['كل الحالات', 'All statuses'], 'c.confirmDelete': ['متأكد إنك عايز تحذف؟', 'Are you sure you want to delete?'],
  'c.showing': ['عرض {from}–{to} من {total}', 'Showing {from}–{to} of {total}'], 'c.done': ['تمت العملية بنجاح', 'Done successfully'],
  'c.sortAsc': ['الاسم أ-ي', 'Name A–Z'], 'c.sortDesc': ['الاسم ي-أ', 'Name Z–A'],
  // errors
  'err.network': ['تعذر الاتصال بالسيرفر. اتأكدي إن الباك إند شغال على المنفذ 8080.', 'Cannot reach the server. Make sure the backend is running on port 8080.'],
  'err.generic': ['حصلت مشكلة، حاولي تاني.', 'Something went wrong, please try again.'],
  'err.roleMissing': ['الباك إند لسه مبيرجعش role في LoginResponse. طبّقي ملف backend-changes.', 'The backend LoginResponse does not return a role yet. Apply the files in backend-changes.'],
  'err.expired': ['انتهت الجلسة، سجّلي دخول تاني.', 'Your session expired, please sign in again.'],
  'err.activeSession': ['الحساب ده مسجّل دخول بالفعل من مكان تاني. اعملي تسجيل خروج منه، أو استني لحد ما الجلسة تنتهي (15 دقيقة).', 'This account is already signed in somewhere else. Log out there, or wait until that session expires (15 minutes).'],
  'r.date': ['التاريخ', 'Date'],
  'err.forbidden': ['مش مسموح لك بالعملية دي.', 'You are not allowed to do this.'],
  'doc.spec': ['التخصص', 'Specialization'], 'doc.allSpecs': ['كل التخصصات', 'All specializations'],
  'doc.sortExpDesc': ['الخبرة: الأعلى أولاً', 'Experience: high to low'], 'doc.sortExpAsc': ['الخبرة: الأقل أولاً', 'Experience: low to high'],
  'doc.pickSpec': ['اختاري التخصص', 'Choose a specialization'],
  'd.total': ['إجمالي المواعيد', 'Total appointments'],
  'a.adminNote': ['قائمة المواعيد للأدمن محتاجة endpoint GET /api/appointments (راجعي backend-changes).', 'The admin appointments list needs GET /api/appointments (see backend-changes).'],
  // auth
  'login.title': ['تسجيل الدخول إلى لوحة التحكم', 'Sign in to the dashboard'], 'login.btn': ['تسجيل الدخول', 'Sign in'],
  'login.new': ['مستخدم جديد؟', 'New user?'], 'login.signup': ['إنشاء حساب', 'Sign up'],
  'reg.title': ['إنشاء حساب جديد', 'Create a new account'], 'reg.btn': ['إنشاء الحساب', 'Create account'],
  'reg.have': ['عندك حساب بالفعل؟', 'Already have an account?'], 'reg.fullName': ['الاسم بالكامل', 'Full name'],
  'reg.passHint': ['8 أحرف على الأقل', 'At least 8 characters'], 'reg.dob': ['تاريخ الميلاد', 'Date of birth'],
  'reg.gender': ['النوع', 'Gender'], 'reg.male': ['ذكر', 'Male'], 'reg.female': ['أنثى', 'Female'],
  'reg.license': ['رقم الترخيص', 'License number'], 'reg.years': ['سنوات الخبرة', 'Years of experience'],
  'reg.fee': ['رسم الكشف (جنيه)', 'Consultation fee (EGP)'], 'reg.adminPass': ['كلمة سر تفعيل الأدمن', 'Admin activation password'],
  'reg.adminHint': ['مطلوبة لتأكيد صلاحية إنشاء حساب أدمن', 'Required to authorize creating an admin account'],
  'reg.ok': ['تم إنشاء الحساب، سجّلي دخول دلوقتي', 'Account created, you can sign in now'],
  'role.ADMIN': ['أدمن', 'Admin'], 'role.DOCTOR': ['دكتور', 'Doctor'], 'role.PATIENT': ['مريض', 'Patient'],
  'role.staff': ['موظف / أدمن', 'Staff / Admin'],
  // nav + titles
  'nav.dashboard': ['الرئيسية', 'Dashboard'], 'nav.doctors': ['الأطباء', 'Doctors'], 'nav.patients': ['المرضى', 'Patients'],
  'nav.myPatients': ['مرضاي', 'My patients'], 'nav.appointments': ['المواعيد', 'Appointments'],
  'nav.myAppointments': ['مواعيدي', 'My appointments'], 'nav.records': ['السجلات والروشتات', 'Records & prescriptions'],
  'nav.myRecord': ['سجلي الطبي', 'My medical record'], 'nav.specializations': ['التخصصات', 'Specializations'],
  'nav.availability': ['مواعيد توفري', 'My availability'], 'nav.book': ['حجز ميعاد', 'Book appointment'],
  'nav.logout': ['تسجيل الخروج', 'Log out'], 'page.overview': ['نظرة عامة', 'Overview'],
  'sub.dash.ADMIN': ['ملخص سريع لنشاط العيادة', 'A quick summary of clinic activity'],
  'sub.dash.DOCTOR': ['ملخص يومك', 'Your day at a glance'],
  'sub.dash.PATIENT': ['ملخص سريع لمواعيدك وصحتك', 'A quick summary of your appointments and health'],
  'sub.doctors': ['إدارة بيانات الأطباء', 'Manage doctors'], 'sub.patients': ['قاعدة بيانات المرضى المسجلين', 'Registered patients database'],
  'sub.myPatients': ['المرضى اللي كشفت عليهم', 'Patients you have treated'],
  'sub.app.ADMIN': ['متابعة مواعيد الكشف', 'Track consultations'], 'sub.app.DOCTOR': ['جدول كشوفاتك', 'Your consultation schedule'],
  'sub.app.PATIENT': ['كل مواعيدك السابقة والقادمة', 'All your past and upcoming appointments'],
  'sub.rec.ADMIN': ['تاريخ الزيارات والعلاج الموصوف', 'Visit history and prescribed treatment'],
  'sub.rec.DOCTOR': ['السجلات والروشتات', 'Records and prescriptions'],
  'sub.rec.PATIENT': ['تشخيصاتك والأدوية الموصوفة لك', 'Your diagnoses and prescribed medications'],
  'sub.spec': ['التخصصات الطبية المتاحة بالعيادة', 'Medical specializations at the clinic'],
  'sub.av': ['الأيام والساعات اللي بتستقبل فيها', 'Days and hours you accept patients'],
  'sub.book': ['اختر الدكتور والوقت المناسب', 'Choose a doctor and a suitable time'],
  // dashboard
  'd.doctors': ['أطباء مسجلين', 'Registered doctors'], 'd.patients': ['مرضى مسجلين', 'Registered patients'],
  'd.appointments': ['إجمالي المواعيد', 'Total appointments'], 'd.specs': ['تخصصات', 'Specializations'],
  'd.today': ['مواعيد اليوم', "Today's appointments"], 'd.myPatients': ['إجمالي مرضاي', 'My total patients'],
  'd.pending': ['مواعيد معلّقة', 'Pending appointments'], 'd.slots': ['فترات التوفر', 'Availability slots'],
  'd.next': ['الميعاد القادم', 'Next appointment'], 'd.upcoming': ['مواعيدي القادمة', 'My upcoming appointments'],
  'd.rx': ['روشتات', 'Prescriptions'], 'd.past': ['زيارات سابقة', 'Past visits'],
  'd.todayList': ['مواعيد اليوم', "Today's appointments"], 'd.bookNew': ['+ حجز ميعاد جديد', '+ Book a new appointment'],
  'd.noNext': ['مفيش ميعاد قادم', 'No upcoming appointment'], 'd.noToday': ['مفيش مواعيد النهارده', 'No appointments today'],
  // doctors / patients / appointments
  'doc.add': ['+ إضافة دكتور', '+ Add doctor'], 'doc.addTitle': ['إضافة دكتور', 'Add doctor'], 'doc.editTitle': ['تعديل دكتور', 'Edit doctor'],
  'doc.editHint': ['التعديل بيبعت كل الحقول، فكمّلي رقم الترخيص والخبرة والرسم.', 'Saving sends every field, so fill in license, experience and fee.'],
  'pat.add': ['+ إضافة مريض', '+ Add patient'], 'pat.addTitle': ['إضافة مريض', 'Add patient'], 'pat.registered': ['تاريخ التسجيل', 'Registration date'],
  'a.patient': ['المريض', 'Patient'], 'a.doctor': ['الدكتور', 'Doctor'], 'a.dateTime': ['التاريخ والوقت', 'Date & time'],
  'a.reason': ['سبب الزيارة', 'Reason for visit'],
  'st.PENDING': ['معلّق', 'Pending'], 'st.CONFIRMED': ['مؤكد', 'Confirmed'], 'st.CANCELLED': ['ملغي', 'Cancelled'],
  'st.COMPLETED': ['مكتمل', 'Completed'], 'st.NO_SHOW': ['لم يحضر', 'No-show'],
  'act.confirm': ['تأكيد', 'Confirm'], 'act.cancel': ['إلغاء الميعاد', 'Cancel'], 'act.complete': ['إكمال', 'Complete'], 'act.noShow': ['لم يحضر', 'No-show'],
  // records
  'r.records': ['السجلات الطبية', 'Medical records'], 'r.rx': ['الروشتات', 'Prescriptions'], 'r.diagnosis': ['التشخيص', 'Diagnosis'],
  'r.notes': ['ملاحظات', 'Notes'], 'r.med': ['الدواء', 'Medication'], 'r.dosage': ['الجرعة (مجم)', 'Dosage (mg)'],
  'r.freq': ['عدد المرات يومياً', 'Times per day'], 'r.dur': ['مدة العلاج (أيام)', 'Duration (days)'], 'r.instr': ['تعليمات إضافية', 'Extra instructions'],
  'rec.addBtn': ['+ إضافة سجل', '+ Add record'], 'rx.addBtn': ['+ إضافة روشتة', '+ Add prescription'],
  'rec.pickAppt': ['اختاري الميعاد', 'Choose an appointment'], 'rx.pickRecord': ['اختاري السجل', 'Choose a record'],
  'rec.noAppts': ['مفيش مواعيد مؤكدة أو مكتملة', 'No confirmed or completed appointments'], 'rec.appt': ['الميعاد', 'Appointment'], 'rec.record': ['السجل', 'Record'],
  'rec.add': ['إضافة سجل', 'Add record'], 'rec.addTitle': ['إضافة سجل طبي', 'Add medical record'],
  'rx.add': ['+ روشتة', '+ Prescription'], 'rx.addTitle': ['إضافة روشتة', 'Add prescription'],
  'rec.forAppt': ['للميعاد:', 'For appointment:'], 'rec.noRx': ['مفيش روشتات لسه', 'No prescriptions yet'],
  // specializations / availability / booking
  'sp.add': ['+ إضافة تخصص', '+ Add specialization'], 'sp.addTitle': ['إضافة تخصص', 'Add specialization'], 'sp.editTitle': ['تعديل تخصص', 'Edit specialization'],
  'sp.desc': ['الوصف', 'Description'],
  'av.add': ['+ إضافة موعد توفر', '+ Add availability slot'], 'av.addTitle': ['إضافة موعد توفر', 'Add availability slot'],
  'av.day': ['اليوم', 'Day'], 'av.from': ['من', 'From'], 'av.to': ['إلى', 'To'],
  'day.SATURDAY': ['السبت', 'Saturday'], 'day.SUNDAY': ['الأحد', 'Sunday'], 'day.MONDAY': ['الإثنين', 'Monday'],
  'day.TUESDAY': ['الثلاثاء', 'Tuesday'], 'day.WEDNESDAY': ['الأربعاء', 'Wednesday'], 'day.THURSDAY': ['الخميس', 'Thursday'], 'day.FRIDAY': ['الجمعة', 'Friday'],
  'b.date': ['التاريخ', 'Date'], 'b.slots': ['الأوقات المتاحة', 'Available times'], 'b.noSlots': ['مفيش أوقات متاحة في اليوم ده', 'No available times on this day'],
  'b.pick': ['اختاري الدكتور والتاريخ الأول', 'Choose a doctor and a date first'], 'b.reasonPh': ['اكتب سبب الزيارة...', 'Describe the reason for your visit...'],
  'b.confirm': ['تأكيد الحجز', 'Confirm booking'], 'b.done': ['تم حجز الميعاد', 'Appointment booked'],
};

@Injectable({ providedIn: 'root' })
export class I18n {
  lang = signal<Lang>(read());
  constructor() {
    effect(() => {
      const l = this.lang();
      document.documentElement.lang = l;
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      try { localStorage.setItem('wc-lang', l); } catch { /* ignore */ }
    });
  }
  toggle() { this.lang.update((l) => (l === 'ar' ? 'en' : 'ar')); }
  t(key: string, params?: Record<string, string | number>): string {
    const e = D[key];
    let s = e ? e[this.lang() === 'ar' ? 0 : 1] : key;
    if (params) for (const k of Object.keys(params)) s = s.replace(`{${k}}`, String(params[k]));
    return s;
  }
}

function read(): Lang {
  try { return localStorage.getItem('wc-lang') === 'en' ? 'en' : 'ar'; } catch { return 'ar'; }
}

@Pipe({ name: 't', pure: false })
export class TPipe implements PipeTransform {
  private i18n = inject(I18n);
  transform(key: string, params?: Record<string, string | number>): string { return this.i18n.t(key, params); }
}
