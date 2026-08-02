-- Dev seed. Re-runnable: every insert is `on conflict do nothing`.
-- Fixed UUIDs so front-end fixtures can hard-code them.

begin;

insert into app_user (id, entra_oid, email, student_code, full_name_th) values
  ('00000000-0000-0000-0000-000000000001', 'dev-exec',    'exec@cmu.ac.th',       null, 'ผู้บริหาร ทดสอบ'),
  ('00000000-0000-0000-0000-000000000002', 'dev-superadm','superadmin@cmu.ac.th', null, 'ซุปเปอร์แอดมิน ทดสอบ'),
  ('00000000-0000-0000-0000-000000000003', 'dev-admin',   'admin@cmu.ac.th',      null, 'แอดมิน ทดสอบ'),
  ('00000000-0000-0000-0000-000000000004', 'dev-advisor', 'advisor@cmu.ac.th',    null, 'อาจารย์ที่ปรึกษา ทดสอบ')
on conflict do nothing;

-- advisor_name must match app_user.full_name_th of the advisor exactly — there is no FK
-- to catch a typo, so seed and app code have to agree on the string.
insert into app_user (id, entra_oid, email, student_code, full_name_th, phone, advisor_name) values
  ('00000000-0000-0000-0000-000000000101', 'dev-student-1', 'student1@cmu.ac.th', '660610001', 'นักศึกษา หนึ่ง', '0812345678', 'อาจารย์ที่ปรึกษา ทดสอบ'),
  ('00000000-0000-0000-0000-000000000102', 'dev-student-2', 'student2@cmu.ac.th', '660610002', 'นักศึกษา สอง',  '0898765432', 'อาจารย์ที่ปรึกษา ทดสอบ')
on conflict do nothing;

-- NAT-52: the executive is also an advisor, on purpose — proves multi-role works.
insert into user_role (user_id, role) values
  ('00000000-0000-0000-0000-000000000001', 'executive'),
  ('00000000-0000-0000-0000-000000000001', 'advisor'),
  ('00000000-0000-0000-0000-000000000002', 'super_admin'),
  ('00000000-0000-0000-0000-000000000003', 'admin'),
  ('00000000-0000-0000-0000-000000000004', 'advisor'),
  ('00000000-0000-0000-0000-000000000101', 'student'),
  ('00000000-0000-0000-0000-000000000102', 'student')
on conflict do nothing;

-- Super admin puts 100,000 THB into the pool. Balance = sum(amount * direction).
insert into fund_transaction (id, kind, amount, direction, performed_by, note) values
  (1, 'top_up', 100000.00, 1, '00000000-0000-0000-0000-000000000002', 'seed: initial fund')
on conflict do nothing;

select setval(pg_get_serial_sequence('fund_transaction', 'id'), (select max(id) from fund_transaction));

commit;
