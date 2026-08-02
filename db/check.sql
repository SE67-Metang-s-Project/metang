-- Constraint self-check. Run after db/seed_dev.sql. Rolls back — leaves nothing behind.
--   psql "$DATABASE_URL" -f db/check.sql
-- Every `ok:` notice is a rule that would silently corrupt money if it stopped holding.

begin;

-- NAT-52: only one executive may exist.
do $$
begin
  begin
    insert into user_role (user_id, role)
    values ('00000000-0000-0000-0000-000000000003', 'executive');
    raise exception 'FAIL one_executive_only: a second executive was accepted';
  exception when unique_violation then
    raise notice 'ok: one_executive_only';
  end;
end $$;

-- A valid loan, used by the checks below.
insert into loan_request (
  id, student_id, advisor_name, amount, amount_in_words, purpose,
  bank_name, bank_account_no, bank_account_name,
  installment_count, first_due_date, status, submitted_at
) values (
  '00000000-0000-0000-0000-0000000000aa',
  '00000000-0000-0000-0000-000000000101',
  'อาจารย์ที่ปรึกษา ทดสอบ',
  3000.00, 'สามพันบาทถ้วน', 'ค่าเทอม',
  'ธนาคารกรุงไทย', '1234567890', 'นักศึกษา หนึ่ง',
  3, current_date + 30, 'pending_advisor', now()
);

-- NAT-24: cannot open a second loan while the first is still running.
do $$
begin
  begin
    insert into loan_request (
      student_id, advisor_name, amount, amount_in_words, purpose,
      bank_name, bank_account_no, bank_account_name,
      installment_count, first_due_date, status
    ) values (
      '00000000-0000-0000-0000-000000000101',
      'อาจารย์ที่ปรึกษา ทดสอบ',
      1000.00, 'หนึ่งพันบาทถ้วน', 'ค่าหอ',
      'ธนาคารกรุงไทย', '1234567890', 'นักศึกษา หนึ่ง',
      1, current_date + 30, 'pending_advisor'
    );
    raise exception 'FAIL one_open_loan_per_student: a second open loan was accepted';
  exception when unique_violation then
    raise notice 'ok: one_open_loan_per_student';
  end;
end $$;

-- NAT-24: repayment period is 1-3 months only.
do $$
begin
  begin
    insert into loan_request (
      student_id, advisor_name, amount, amount_in_words, purpose,
      bank_name, bank_account_no, bank_account_name,
      installment_count, first_due_date
    ) values (
      '00000000-0000-0000-0000-000000000102',
      'อาจารย์ที่ปรึกษา ทดสอบ',
      1000.00, 'หนึ่งพันบาทถ้วน', 'ค่าหนังสือ',
      'ธนาคารกรุงไทย', '0987654321', 'นักศึกษา สอง',
      4, current_date + 30
    );
    raise exception 'FAIL installment_count: 4 installments were accepted';
  exception when check_violation then
    raise notice 'ok: installment_count between 1 and 3';
  end;
end $$;

-- NAT-46: the admin may cut the amount, never raise it.
do $$
begin
  begin
    update loan_request set approved_amount = 5000.00
    where id = '00000000-0000-0000-0000-0000000000aa';   -- requested 3000
    raise exception 'FAIL approved_amount: an approval above the requested amount was accepted';
  exception when check_violation then
    raise notice 'ok: approved_amount cannot exceed amount';
  end;
end $$;

-- NAT-31/32: the same bank slip cannot be submitted twice.
insert into payment (loan_id, amount, slip_ref, paid_at)
values ('00000000-0000-0000-0000-0000000000aa', 1000.00, 'SLIP-TEST-0001', now());

do $$
begin
  begin
    insert into payment (loan_id, amount, slip_ref, paid_at)
    values ('00000000-0000-0000-0000-0000000000aa', 1000.00, 'SLIP-TEST-0001', now());
    raise exception 'FAIL payment.slip_ref: a duplicate slip was accepted';
  exception when unique_violation then
    raise notice 'ok: slip_ref is unique';
  end;
end $$;

-- NAT-40: fund balance is derived from the ledger, not stored.
do $$
declare
  balance numeric;
begin
  insert into fund_transaction (kind, amount, direction, loan_id, performed_by, note)
  values ('disburse', 3000.00, -1, '00000000-0000-0000-0000-0000000000aa',
          '00000000-0000-0000-0000-000000000003', 'check: disburse test loan');

  select sum(amount * direction) into balance from fund_transaction;

  if balance <> 97000.00 then
    raise exception 'FAIL fund balance: expected 97000.00, got %', balance;
  end if;
  raise notice 'ok: fund balance = %', balance;
end $$;

rollback;
