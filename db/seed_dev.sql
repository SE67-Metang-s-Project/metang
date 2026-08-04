-- Comprehensive mock data for a personal Neon testing branch.
-- Re-runnable: fixed primary keys and ON CONFLICT keep fixtures stable.

begin;

\if :{?reset}
truncate table
  payment,
  installment,
  loan_approval,
  fund_transaction,
  audit_log,
  user_role,
  loan_request,
  app_user
restart identity;
\endif

insert into app_user (id, email, full_name_th, full_name_en, phone) values
  ('00000000-0000-0000-0000-000000000001', 'exec@cmu.ac.th', 'ผู้บริหาร ทดสอบ', 'Mock Executive', null),
  ('00000000-0000-0000-0000-000000000002', 'superadmin@cmu.ac.th', 'ซุปเปอร์แอดมิน ทดสอบ', 'Mock Super Admin', null),
  ('00000000-0000-0000-0000-000000000003', 'admin@cmu.ac.th', 'แอดมิน ทดสอบ', 'Mock Admin', '0800000003'),
  ('00000000-0000-0000-0000-000000000004', 'advisor@cmu.ac.th', 'อาจารย์ที่ปรึกษา ทดสอบ', 'Mock Advisor', '0800000004'),
  ('00000000-0000-0000-0000-000000000005', 'advisor2@cmu.ac.th', 'อาจารย์สำรอง ทดสอบ', 'Backup Advisor', null)
on conflict (id) do nothing;

insert into app_user (id, email, student_code, full_name_th, full_name_en, phone)
select
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  format('student%s@cmu.ac.th', n - 100),
  '660610' || lpad((n - 100)::text, 3, '0'),
  format('นักศึกษา ทดสอบ %s', n - 100),
  format('Mock Student %s', n - 100),
  case when n in (106, 109) then null else '0810000' || lpad(n::text, 3, '0') end
from generate_series(101, 111) n
on conflict (id) do nothing;

insert into user_role (user_id, role, granted_by) values
  ('00000000-0000-0000-0000-000000000001', 'executive', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', 'advisor', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000002', 'super_admin', null),
  ('00000000-0000-0000-0000-000000000003', 'admin', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000004', 'advisor', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000005', 'advisor', '00000000-0000-0000-0000-000000000002')
on conflict do nothing;

insert into user_role (user_id, role, granted_by)
select
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'student',
  '00000000-0000-0000-0000-000000000002'
from generate_series(101, 111) n
on conflict do nothing;

-- Every loan status, plus cancellation by both student and admin.
insert into loan_request (
  id, student_id, advisor_name, amount, approved_amount, purpose,
  bank_name, bank_account_no, bank_account_name, installment_count,
  first_due_date, status, submitted_at, cancelled_at, cancelled_by,
  disbursed_at, closed_at, created_at
)
select
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0000-' || lpad((n - 100)::text, 12, '0'))::uuid,
  case when n in (208, 209) then 'อาจารย์สำรอง ทดสอบ' else 'อาจารย์ที่ปรึกษา ทดสอบ' end,
  amount,
  approved_amount,
  'Mock scenario: ' || status,
  'ธนาคารกรุงไทย',
  '1000000' || n,
  format('นักศึกษา ทดสอบ %s', n - 200),
  installment_count,
  current_date + due_offset,
  status::loan_status,
  case when n in (201, 210) then null else now() - interval '7 days' end,
  case when status = 'cancelled' then now() - interval '1 day' else null end,
  case when n = 210 then ('00000000-0000-0000-0000-000000000110')::uuid
       when n = 211 then ('00000000-0000-0000-0000-000000000003')::uuid end,
  case when status in ('disbursed', 'closed') then now() - interval '60 days' else null end,
  case when status = 'closed' then now() - interval '10 days' else null end,
  now() - interval '14 days'
from (values
  (201, 'draft',                1500::numeric, null::numeric, 1::smallint,  30),
  (202, 'returned',             2000, null, 2,  30),
  (203, 'pending_advisor',      2500, null, 1,  25),
  (204, 'pending_admin',        3000, null, 3,  24),
  (205, 'pending_executive',    3500, 3200, 2,  22),
  (206, 'pending_disbursement', 4000, 3800, 2,  20),
  (207, 'disbursed',            4500, 4500, 3, -30),
  (208, 'closed',               3000, 3000, 3, -90),
  (209, 'rejected',             2800, null, 2,  15),
  (210, 'cancelled',            1800, null, 1,  28),
  (211, 'cancelled',            2200, null, 2,  18)
) scenario(n, status, amount, approved_amount, installment_count, due_offset)
on conflict (id) do nothing;

-- Every approval step and decision.
insert into loan_approval (id, loan_id, step, decision, decided_by, decided_at, comment)
select
  id,
  ('00000000-0000-0000-0000-' || lpad(loan_n::text, 12, '0'))::uuid,
  step::approval_step,
  result::decision,
  case when actor_n is null then null
       else ('00000000-0000-0000-0000-' || lpad(actor_n::text, 12, '0'))::uuid end,
  case when actor_n is null then null else now() - interval '3 days' end,
  comment
from (values
  (2001, 202, 'advisor',   'returned', 4, 'กรุณาแนบรายละเอียดค่าใช้จ่าย'),
  (2002, 203, 'advisor',   'pending',  null, null),
  (2003, 204, 'advisor',   'approved', 4, null),
  (2004, 204, 'admin',     'pending',  null, null),
  (2005, 205, 'advisor',   'approved', 4, null),
  (2006, 205, 'admin',     'approved', 3, 'อนุมัติลดเหลือ 3,200 บาท'),
  (2007, 205, 'executive', 'pending',  null, null),
  (2008, 206, 'advisor',   'approved', 4, null),
  (2009, 206, 'admin',     'approved', 3, null),
  (2010, 206, 'executive', 'approved', 1, null),
  (2011, 207, 'advisor',   'approved', 4, null),
  (2012, 207, 'admin',     'approved', 3, null),
  (2013, 207, 'executive', 'approved', 1, null),
  (2014, 208, 'advisor',   'approved', 5, null),
  (2015, 208, 'admin',     'approved', 3, null),
  (2016, 208, 'executive', 'approved', 1, null),
  (2017, 209, 'advisor',   'approved', 5, null),
  (2018, 209, 'admin',     'rejected', 3, 'เอกสารไม่ผ่านเกณฑ์')
) approval(id, loan_n, step, result, actor_n, comment)
on conflict (id) do nothing;

-- Overdue, partial, upcoming, paid early, paid late, and paid on time.
insert into installment (id, loan_id, seq, due_date, amount_due, amount_paid, settled_at) values
  (1001, '00000000-0000-0000-0000-000000000207', 1, current_date - 30, 1500, 0, null),
  (1002, '00000000-0000-0000-0000-000000000207', 2, current_date + 10, 1500, 500, null),
  (1003, '00000000-0000-0000-0000-000000000207', 3, current_date + 40, 1500, 0, null),
  (1004, '00000000-0000-0000-0000-000000000208', 1, current_date - 90, 1000, 1000, now() - interval '92 days'),
  (1005, '00000000-0000-0000-0000-000000000208', 2, current_date - 60, 1000, 1000, now() - interval '55 days'),
  (1006, '00000000-0000-0000-0000-000000000208', 3, current_date - 30, 1000, 1000, now() - interval '30 days')
on conflict (id) do nothing;

-- Every OCR state and payment review state.
insert into payment (
  id, loan_id, installment_id, amount, slip_url, slip_ref, slip_ocr_status,
  ocr_amount, ocr_paid_at, slip_ocr_raw, status, confirmed_by, confirmed_at, paid_at
)
select
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  ('00000000-0000-0000-0000-' || lpad(loan_n::text, 12, '0'))::uuid,
  installment_id,
  amount,
  format('/mock/slips/%s.jpg', n),
  format('MOCK-SLIP-%s', n),
  ocr_state,
  case when ocr_state = 'verified' then amount when ocr_state = 'failed' then 150 end,
  case when ocr_state = 'pending' then null else now() - interval '3 days' end,
  case when ocr_state = 'pending' then null else jsonb_build_object('source', 'mock', 'state', ocr_state) end,
  payment_status,
  case when payment_status = 'pending_review' then null else '00000000-0000-0000-0000-000000000003'::uuid end,
  case when payment_status = 'pending_review' then null else now() - interval '2 days' end,
  now() - interval '3 days'
from (values
  (301, 208, 1004::bigint, 1000::numeric, 'verified', 'confirmed'),
  (302, 208, 1005, 1000, 'manual',   'confirmed'),
  (303, 208, 1006, 1000, 'verified', 'confirmed'),
  (304, 207, 1002,  500, 'pending',  'pending_review'),
  (305, 207, 1001, 1500, 'failed',   'rejected')
) payment_case(n, loan_n, installment_id, amount, ocr_state, payment_status)
on conflict (id) do nothing;

-- Every ledger kind and both directions.
insert into fund_transaction (id, kind, amount, direction, loan_id, performed_by, slip_url, note) values
  (1,  'top_up',    100000,  1, null, '00000000-0000-0000-0000-000000000002', null, 'mock initial fund'),
  (10, 'disburse',    4500, -1, '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000003', '/mock/slips/disbursement-207.jpg', 'mock disbursement'),
  (11, 'disburse',    3000, -1, '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000003', '/mock/slips/disbursement-208.jpg', 'mock disbursement'),
  (12, 'repayment',   1000,  1, '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000003', null, 'confirmed MOCK-SLIP-301'),
  (13, 'repayment',   1000,  1, '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000003', null, 'confirmed MOCK-SLIP-302'),
  (14, 'repayment',   1000,  1, '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000003', null, 'confirmed MOCK-SLIP-303'),
  (15, 'adjustment',   250,  1, null, '00000000-0000-0000-0000-000000000002', null, 'mock reconciliation adjustment')
on conflict (id) do nothing;

insert into audit_log (id, actor_id, action, entity_type, entity_id, before, after) values
  (3001, '00000000-0000-0000-0000-000000000003', 'approve_amount', 'loan_request', '00000000-0000-0000-0000-000000000205', '{"approved_amount":null}', '{"approved_amount":3200}'),
  (3002, '00000000-0000-0000-0000-000000000001', 'approve', 'loan_request', '00000000-0000-0000-0000-000000000206', '{"status":"pending_executive"}', '{"status":"pending_disbursement"}'),
  (3003, '00000000-0000-0000-0000-000000000003', 'disburse', 'loan_request', '00000000-0000-0000-0000-000000000207', '{"status":"pending_disbursement"}', '{"status":"disbursed"}'),
  (3004, '00000000-0000-0000-0000-000000000003', 'confirm_payment', 'payment', '00000000-0000-0000-0000-000000000301', '{"status":"pending_review"}', '{"status":"confirmed"}'),
  (3005, '00000000-0000-0000-0000-000000000002', 'adjust_fund', 'fund', 'main', null, '{"amount":250,"direction":1}')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('loan_approval', 'id'), greatest((select max(id) from loan_approval), 1), true);
select setval(pg_get_serial_sequence('installment', 'id'), greatest((select max(id) from installment), 1), true);
select setval(pg_get_serial_sequence('fund_transaction', 'id'), greatest((select max(id) from fund_transaction), 1), true);
select setval(pg_get_serial_sequence('audit_log', 'id'), greatest((select max(id) from audit_log), 1), true);

-- Fail and roll back if any modeled state is missing.
do $$
begin
  if (select count(distinct status) from loan_request where id between '00000000-0000-0000-0000-000000000201' and '00000000-0000-0000-0000-000000000211') <> 10 then
    raise exception 'mock coverage: missing loan status';
  end if;
  if (select count(distinct role) from user_role where user_id between '00000000-0000-0000-0000-000000000001' and '00000000-0000-0000-0000-000000000111') <> 5 then
    raise exception 'mock coverage: missing user role';
  end if;
  if (select count(distinct step) from loan_approval where id between 2001 and 2018) <> 3
     or (select count(distinct decision) from loan_approval where id between 2001 and 2018) <> 4 then
    raise exception 'mock coverage: missing approval state';
  end if;
  if (select count(distinct slip_ocr_status) from payment where id between '00000000-0000-0000-0000-000000000301' and '00000000-0000-0000-0000-000000000305') <> 4
     or (select count(distinct status) from payment where id between '00000000-0000-0000-0000-000000000301' and '00000000-0000-0000-0000-000000000305') <> 3 then
    raise exception 'mock coverage: missing payment state';
  end if;
  if (select count(distinct kind) from fund_transaction where id in (1, 10, 11, 12, 13, 14, 15)) <> 4
     or (select count(distinct direction) from fund_transaction where id in (1, 10, 11, 12, 13, 14, 15)) <> 2 then
    raise exception 'mock coverage: missing fund transaction state';
  end if;
  if not exists (
    select 1 from student_conduct
    where student_id = '00000000-0000-0000-0000-000000000107'
      and is_delinquent and overdue_count > 0
  ) or not exists (
    select 1 from student_conduct
    where student_id = '00000000-0000-0000-0000-000000000108'
      and not is_delinquent and late_payment_count > 0
  ) then
    raise exception 'mock coverage: missing conduct scenario';
  end if;
end $$;

commit;
