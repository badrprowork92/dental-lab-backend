from pathlib import Path
import json
import re
from datetime import datetime, timezone

root = Path(__file__).resolve().parents[1]
config = json.loads((root / '.project-config.json').read_text())
keys = sorted(set(config.get('env_vars', {})) | set(config.get('secrets', {})))
env_rows = '\n'.join(f'| `{key}` | {"secret" if key in config.get("secrets", {}) else "plain/config"} | لا تُحفظ القيمة داخل هذا الملف |' for key in keys)
schema = (root / 'drizzle/schema.ts').read_text()
routers = (root / 'server/routers.ts').read_text()
db_migration = (root / 'drizzle/0009_user_device_limits.sql').read_text()

doc = f'''# PROJECT_MASTER_DOCUMENTATION

> **حالة الوثيقة:** مرجع تشغيلي آمن مولّد في {datetime.now(timezone.utc).strftime('%Y-%m-%d')} بواسطة Manus AI. لا تحتوي هذه الوثيقة على كلمات مرور أو رموز وصول أو مفاتيح طوارئ فعلية.

## 1. نظرة عامة

المشروع تطبيق Expo/React Native لإدارة حسابات مختبر الأسنان، مع Backend مبني على Express وtRPC وقاعدة بيانات MySQL متصلة عبر Drizzle ORM. يدعم النظام حساب مسؤول المنصة وحسابات مستخدمي المختبر، والصناديق والعملات YER/SAR/USD والتقارير وتسجيل الأجهزة.

## 2. البنية ومسارات التشغيل

| الجزء | المسار | الوظيفة |
|---|---|---|
| تطبيق الهاتف | `app/` | شاشات Expo Router وواجهات المستخدم |
| مكونات الواجهة | `components/` | عناصر UI المشتركة، ومنها التحديث والسحب |
| عميل API | `lib/trpc.ts` | عميل tRPC وإرسال الطلبات إلى Backend |
| المصادقة | `server/lab-auth.ts`, `server/db.ts` | التحقق من الحسابات والجلسات والأجهزة |
| الراوتر | `server/routers.ts` | مسارات tRPC والصلاحيات |
| قاعدة البيانات | `drizzle/schema.ts` | مخطط MySQL الكامل |
| الترحيلات | `drizzle/*.sql` | تغييرات المخطط القابلة لإعادة التطبيق |
| التقارير | `lib/pdf-reports.ts` | قوالب PDF العربية والمشاركة |

## 3. متغيرات البيئة والربط

القيم الفعلية تُدار في مدير الأسرار أو إعداد EAS ولا تُضمّن في الأرشيف. الأسماء التي يتوقعها المشروع هي:

| المتغير | التصنيف | الاستخدام |
|---|---|---|
{env_rows}
| `EXPO_PUBLIC_API_BASE_URL` | public build variable | عنوان Backend الذي يضم `/api/trpc` ومسارات المصادقة |
| `VITE_FRONTEND_FORGE_API_URL` | public/config | عنوان Forge أو خدمة الواجهة عند الحاجة |

في EAS يجب ضبط `EXPO_PUBLIC_API_BASE_URL` في بيئة البناء نفسها، لأن قيمة `EXPO_PUBLIC_*` تُضمّن داخل حزمة التطبيق أثناء البناء. لا تستخدم `localhost` داخل APK مثبت على جهاز خارجي.

## 4. مخطط قاعدة البيانات الكامل

المصدر المعتمد للمخطط هو `drizzle/schema.ts` التالي:

```typescript
{schema}
```

## 5. ترحيل حد الأجهزة لكل مستخدم

تمت إضافة العمود `labUsers.maxDevices` مع قيمة افتراضية `1`، وتمت تهيئة المستخدمين الحاليين من حد المختبر السابق. ملف الترحيل:

```sql
{db_migration}
```

يجب تطبيق الترحيل على قاعدة الإنتاج مرة واحدة قبل تشغيل نسخة Backend التي تقرأ العمود الجديد. لا تستخدم `drizzle-kit migrate` على قاعدة تحتوي جداول موجودة إذا لم يكن سجل الترحيلات متزامناً؛ استخدم migration مُراجعاً أو طبّق ALTER idempotent عبر اتصال إداري.

## 6. مسارات Backend وAPI

المصدر الكامل للراوتر هو `server/routers.ts`:

```typescript
{routers}
```

أهم المسارات الوظيفية هي `auth.labLogin` لتسجيل دخول مستخدم المختبر، `auth.me`/الجلسة لجلب الحساب الحالي، `lab.bootstrap` لتحميل بيانات المختبر، `lab.cashboxes.*` لإدارة الصناديق والتحويلات، `lab.reports.*` للتقارير ومنها `cashboxStatement`، `admin.*` لإدارة المختبرات والحسابات والأجهزة، و`lab.currencies.*` لإدارة العملات. جميع مسارات المختبر تتطلب جلسة مختبر صالحة، ومسارات الأدمن تتطلب دور `admin`.

## 7. المصادقة والأمان

تُخزّن كلمات المرور على هيئة hash ولا تُعرض نصياً. إعادة التعيين تتم من لوحة الأدمن وتُلغي الجلسات السابقة وتفرض تغيير كلمة المرور عند الدخول التالي. لا يجب إضافة كلمات المرور أو `DATABASE_URL` أو `EXPO_TOKEN` أو `LAB_ADMIN_SETUP_CODE` أو `COOKIE_SECRET` أو مفاتيح التخزين إلى Git أو إلى هذا الملف.

بيانات الطوارئ تُدار عبر مدير الأسرار باسم المتغير المناسب فقط. عند فقدانها، أنشئ قيمة جديدة ودوّرها ثم أعد تشغيل Backend؛ لا تضع القيمة داخل التطبيق أو الوثائق أو رسائل الفريق.

## 8. التشغيل المحلي

```bash
pnpm install
pnpm check
pnpm test
pnpm dev:server
```

يتطلب Backend المتغيرات السرية من مدير البيئة. للصحة استخدم `GET /api/health`، وللاختبار بعد تسجيل الدخول استخدم عميل tRPC أو شاشة التطبيق. لا تعتبر رابط expose مؤقتاً استضافة إنتاجية.

## 9. النشر الخارجي الدائم

يجب نشر Backend على خدمة دائمة تدعم Node.js 20+ أو أحدث، وتهيئة `DATABASE_URL` و`COOKIE_SECRET` ومتغيرات المصادقة والتخزين في مدير الأسرار. شغّل `pnpm build` ثم `pnpm start`، واجعل الخدمة تستمع إلى `0.0.0.0` والمنفذ الذي توفره المنصة عبر `PORT`. أضف health check إلى `/api/health`، فعّل HTTPS، واضبط CORS وDNS، ثم اختبر `auth.labLogin`, `lab.bootstrap`, `lab.cashboxes.list` و`lab.reports.cashboxStatement`.

بعد الحصول على عنوان HTTPS دائم:

```bash
eas env:create --environment preview --name EXPO_PUBLIC_API_BASE_URL --value https://BACKEND-DOMAIN.example --scope project
eas build --platform android --profile production
```

تختلف صيغة أمر EAS حسب إصدار CLI؛ راجع `eas env --help` قبل التنفيذ. لا تحفظ الرمز المميز في المشروع أو في سجل CI، واستخدم secret manager أو `EXPO_TOKEN` مؤقتاً.

## 10. البناء والإصدار

ملف `eas.json` يعرّف بناء `preview` كـ APK للاختبار. للإنتاج، أنشئ profile باسم `production` مع `android.buildType` المناسب، ثبّت `versionCode` متزايداً، وابنِ من commit محدد بعد نجاح الاختبارات. يجب تنزيل APK الناتج والتحقق من `file` و`unzip -t` قبل التوزيع.

## 11. النسخ الاحتياطي والتشغيل الآمن

قبل أي ترحيل إنتاجي، خذ نسخة احتياطية مشفرة من قاعدة البيانات. احتفظ بنسخة من ملف البيئة في مدير أسرار منفصل، ودوّر الرموز التي ظهرت في جلسات أو سجلات سابقة. لا تسمح بعرض كلمات المرور القديمة في لوحة الأدمن؛ استخدم إعادة تعيين لمرة واحدة فقط.

## 12. الملفات المرجعية

المصادر الأساسية هي `drizzle/schema.ts`, `server/routers.ts`, `server/db.ts`, `server/lab-auth.ts`, `lib/trpc.ts`, `lib/pdf-reports.ts`, `eas.json`, `app.config.ts`, و`drizzle/0009_user_device_limits.sql`. هذا الملف مرجع تشغيلي، بينما تبقى ملفات المصدر نفسها المرجع التنفيذي الوحيد.
'''
(root / 'PROJECT_MASTER_DOCUMENTATION.md').write_text(doc)
print('documentation_written', len(doc), 'bytes')
