# คู่มือการใช้งาน API — Email API

คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
Faculty of Nursing, Chiang Mai University
Last updated: 2026-05-19

\* เอกสารห้ามเผยแพร่

## 1. ภาพรวม (Overview)

ระบบส่งอีเมลอัตโนมัติสำหรับนักศึกษาและบุคลากรของคณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่

API นี้ให้บริการส่งอีเมล HTML ผ่าน SMTP ของมหาวิทยาลัย โดยใช้ Bearer Token ในการยืนยันตัวตน
อีเมลที่ส่งออกจะมี template สำเร็จรูปพร้อมโลโก้คณะพยาบาลศาสตร์ มช.

**Base URL**

```
https://mis.nurse.cmu.ac.th/thesis
```

### 1.1 Flow การใช้งาน

1. ขอ Token → `POST /EmailApi/GetToken` (ส่ง client_id + client_secret)
2. ส่งอีเมล → `POST /EmailApi/SendEmail` (ใส่ Bearer Token ใน header)

## 2. การยืนยันตัวตน (Bearer Token)

Token มีอายุ 24 ชั่วโมง นับจากเวลาที่ขอ เมื่อ token หมดอายุ ให้ขอใหม่ผ่านปลายทาง `/GetToken`

**รูปแบบ Header**

```
Authorization: Bearer <access_token>
```

## 3. Endpoints

### 3.1 POST /GetToken

ขอ Bearer Token สำหรับใช้เรียก API

**URL**

```
POST https://mis.nurse.cmu.ac.th/thesis/EmailApi/GetToken
```

**Headers**

| Key | Value |
|---|---|
| Content-Type | application/json |

**Request Body**

```json
{
  "client_id": "...",
  "client_secret": "..."
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

**คำอธิบายฟิลด์ Response**

| Field | Type | คำอธิบาย |
|---|---|---|
| success | bool | สถานะการดำเนินการ |
| access_token | string | Bearer Token สำหรับใช้งาน |
| token_type | string | ประเภท token (คงที่เป็น Bearer) |
| expires_in | number | อายุ token เป็นวินาที (= 86400) |

**Response — 401 Unauthorized**

```json
{
  "success": false,
  "message": "Invalid client_id or client_secret"
}
```

### 3.2 POST /SendEmail

ส่งอีเมลพร้อม HTML template ของคณะพยาบาลศาสตร์ มช.

**URL**

```
POST https://mis.nurse.cmu.ac.th/thesis/EmailApi/SendEmail
```

**Headers**

| Key | Value |
|---|---|
| Content-Type | application/json |
| Authorization | Bearer \<access_token\> |

**Request Body**

```json
{
  "subject": "แจ้งผลการอนุมัติเครื่องมือวิจัย",
  "sent_to": "student@cmu.ac.th",
  "cc_to": "admin1@cmu.ac.th, admin2@cmu.ac.th",
  "message": "เรียน นักศึกษา\n\nแจ้งให้ทราบว่าวิทยานิพนธ์ของท่านได้รับการพิจารณาเรียบร้อยแล้ว\n\nขอแสดงความนับถือ",
  "system_name": "ResearchTool"
}
```

**คำอธิบายฟิลด์ Request**

| Field | Type | Required | คำอธิบาย |
|---|---|---|---|
| subject | string | ใช่ | หัวเรื่องอีเมล |
| sent_to | string | ใช่ | อีเมลผู้รับ — คั่นหลายคนด้วย `,` หรือ `;` |
| cc_to | string | ไม่ | อีเมล CC — คั่นหลายคนด้วย `,` หรือ `;` (เว้นว่างได้) |
| message | string | ใช่ | เนื้อหาอีเมล รองรับ `\n` สำหรับขึ้นบรรทัดใหม่ |
| system_name | string | ใช่ | ชื่อระบบ เช่น ResearchTool (ห้ามมีช่องว่าง) |

> **หมายเหตุ:** `sent_to` และ `cc_to` รองรับหลาย address ในครั้งเดียว ตัวอย่าง:
> `"sent_to": "a@cmu.ac.th, b@cmu.ac.th"`

**Response — 200 OK**

```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

## 4. Error Codes

ตารางรหัสข้อผิดพลาดที่อาจพบเมื่อเรียกใช้งาน API

| HTTP Status | message | สาเหตุ |
|---|---|---|
| 400 | Invalid JSON body | Body ไม่ใช่ JSON ที่ถูกต้อง |
| 400 | Field 'subject' is required | ไม่ส่งค่า subject |
| 400 | Field 'sent_to' is required | ไม่ส่งค่า sent_to |
| 400 | Field 'message' is required | ไม่ส่งค่า message |
| 400 | Field 'system_name' is required | ไม่ส่งค่า system_name |
| 401 | Missing or invalid Authorization header | ไม่มี header หรือรูปแบบไม่ถูกต้อง |
| 401 | Invalid token format | Token ไม่ตรงรูปแบบ |
| 401 | Invalid token signature | Token ถูกแก้ไขหรือใช้ secret ไม่ตรง |
| 401 | Token has expired | Token หมดอายุแล้ว ให้ขอใหม่ |
| 401 | Invalid client_id or client_secret | Credentials ไม่ถูกต้อง |
| 500 | Failed to send email. Please try again later. | SMTP error (ดู Debug log ของ server) |

## 5. ตัวอย่างการใช้งาน

### 5.1 cURL

**Step 1 — ขอ Token**

```bash
curl -X POST https://mis.nurse.cmu.ac.th/thesis/EmailApi/GetToken \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "...",
    "client_secret": "..."
  }'
```

**Step 2 — ส่งอีเมล**

```bash
curl -X POST https://mis.nurse.cmu.ac.th/thesis/EmailApi/SendEmail \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJjbGllbnRfaWQiOiJudXJzZS1lbWFpbC1hcGki..." \
  -d '{
    "subject": "แจ้งผลการพิจารณาวิทยานิพนธ์",
    "sent_to": "student@cmu.ac.th",
    "cc_to": "advisor@nurse.cmu.ac.th",
    "message": "เรียน นักศึกษา\n\nแจ้งผลการพิจารณาเรียบร้อยแล้ว\n\nขอแสดงความนับถือ",
    "system_name": "ResearchTools"
  }'
```

## 6. หมายเหตุเพิ่มเติม

- อีเมลผู้ส่งคงที่เป็น `no-reply-ResearchTool@cmu.ac.th`
- SMTP Server: `10.0.0.5:587` (TLS) — ใช้ได้เฉพาะเครือข่ายภายใน มช.
- ขึ้นบรรทัดใหม่ใน `message` ใช้ `\n` — ระบบแปลงเป็น `<br/>` ให้อัตโนมัติ
- Token หมดอายุใน 24 ชั่วโมง — แนะนำให้ขอ token ใหม่ก่อนหมดอายุ หรือ handle HTTP 401
- API ไม่มี rate limiting ในปัจจุบัน — ควรจัดการ throttling ใน client

## 7. ตัวอย่างผลลัพธ์การใช้งาน

Request ตัวอย่างจาก Postman (`StudentReport > 02-SendEmail`) ส่งไปยัง
`POST https://mis.nurse.cmu.ac.th/thesis/EmailApi/SendEmail` พร้อม body:

```json
{
  "subject": "แจ้งผลการพิจารณาวิทยานิพนธ์",
  "sent_to": "SomChai@cmu.ac.th",
  "cc_to": "",
  "message": "เรียนนักศึกษา\n\nแจ้งผลการพิจารณาเรียบร้อยแล้ว\n\nขอแสดงความนับถือ\nดูรายละเอียดได้ที่: https://www.google.com",
  "system_name": "ThesisSystem"
}
```

ผลลัพธ์คืออีเมล HTML พร้อม logo คณะพยาบาลศาสตร์ มช., หัวข้อเรื่อง, เนื้อหาที่ขึ้นบรรทัดใหม่ตาม
`\n`, และ footer "ส่งโดยระบบอัตโนมัติ" พร้อมข้อความ "Sent via ThesisSystem System"
