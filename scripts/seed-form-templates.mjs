import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const defaultFields = JSON.stringify([
  { key: "visitorName", label: "Visitor Name", labelAr: "اسم الزائر", source: "request.visitorName", type: "text", isRequired: true, sortOrder: 1 },
  { key: "visitorIdNumber", label: "ID / Iqama Number", labelAr: "رقم الهوية / الإقامة", source: "request.visitorIdNumber", type: "text", isRequired: true, sortOrder: 2 },
  { key: "visitorCompany", label: "Company", labelAr: "الشركة", source: "request.visitorCompany", type: "text", isRequired: true, sortOrder: 3 },
  { key: "purpose", label: "Purpose of Visit", labelAr: "الغرض من الزيارة", source: "request.purpose", type: "text", isRequired: true, sortOrder: 4 },
  { key: "startDate", label: "Valid From", labelAr: "صالح من", source: "request.startDate", type: "date", isRequired: true, sortOrder: 5 },
  { key: "endDate", label: "Valid Until", labelAr: "صالح حتى", source: "request.endDate", type: "date", isRequired: true, sortOrder: 6 },
  { key: "siteName", label: "Site / Building", labelAr: "الموقع / المبنى", source: "request.siteName", type: "text", isRequired: true, sortOrder: 7 },
  { key: "visitorPhone", label: "Phone Number", labelAr: "رقم الهاتف", source: "request.visitorPhone", type: "phone", isRequired: false, sortOrder: 8 },
]);

const defaultInfoSections = JSON.stringify([
  { icon: "wifi", title: "Internet", titleAr: "الإنترنت", content: "Guest WiFi: Centre3-Guest", contentAr: "واي فاي الضيوف: Centre3-Guest", isActive: true, sortOrder: 1 },
  { icon: "building", title: "Building / Site", titleAr: "المبنى / الموقع", content: "Follow escort at all times", contentAr: "اتبع المرافق في جميع الأوقات", isActive: true, sortOrder: 2 },
  { icon: "car", title: "Parking", titleAr: "موقف السيارات", content: "Visitor parking available at Gate 1", contentAr: "موقف الزوار متاح عند البوابة 1", isActive: true, sortOrder: 3 },
]);

const defaultSafetyRules = JSON.stringify([
  { icon: "shield", iconColor: "#EF4444", title: "Safety First", titleAr: "السلامة أولاً", subtitle: "Follow all safety instructions", subtitleAr: "اتبع جميع تعليمات السلامة", isActive: true, sortOrder: 1 },
  { icon: "hardhat", iconColor: "#F59E0B", title: "PPE Required", titleAr: "معدات الحماية مطلوبة", subtitle: "Wear required protective equipment", subtitleAr: "ارتد معدات الحماية المطلوبة", isActive: true, sortOrder: 2 },
  { icon: "cigarette", iconColor: "#EF4444", title: "No Smoking", titleAr: "ممنوع التدخين", subtitle: "Smoking is strictly prohibited", subtitleAr: "التدخين ممنوع منعاً باتاً", isActive: true, sortOrder: 3 },
  { icon: "camera", iconColor: "#3B82F6", title: "No Photography", titleAr: "ممنوع التصوير", subtitle: "Photography is not allowed", subtitleAr: "التصوير غير مسموح", isActive: true, sortOrder: 4 },
  { icon: "phone", iconColor: "#8B5CF6", title: "Emergency", titleAr: "الطوارئ", subtitle: "Call 911 for emergencies", subtitleAr: "اتصل 911 للطوارئ", isActive: true, sortOrder: 5 },
  { icon: "footprints", iconColor: "#10B981", title: "Restricted Areas", titleAr: "مناطق محظورة", subtitle: "Stay in authorized areas only", subtitleAr: "ابق في المناطق المصرح بها فقط", isActive: true, sortOrder: 6 },
]);

const templates = [
  {
    name: "Admin Visit - Standard",
    description: "Default form template for admin visit requests",
    requestType: "admin_visit",
    isDefault: true,
    isActive: true,
    companyName: "Centre3",
    companyNameAr: "سنتر3",
    headerColor: "#6B21A8",
    formTitle: "Visit Permission",
    formTitleAr: "تصريح زيارة",
    formSubtitle: "Visitor Access Pass",
    formSubtitleAr: "بطاقة دخول الزائر",
    footerDepartment: "Security Operations Centre",
    footerDepartmentAr: "مركز العمليات الأمنية",
    footerPhone: "+966 11 000 0000",
    footerEmail: "security@centre3.com",
    footerText: "This pass must be displayed at all times while on premises.",
    footerTextAr: "يجب عرض هذا التصريح في جميع الأوقات أثناء التواجد في المبنى.",
    disclaimerText: "This visitor pass is non-transferable and must be returned upon departure. The holder agrees to comply with all site safety and security regulations.",
    disclaimerTextAr: "تصريح الزيارة هذا غير قابل للتحويل ويجب إعادته عند المغادرة. يوافق حامله على الامتثال لجميع لوائح السلامة والأمن في الموقع.",
    showQrCode: true,
    qrCodePosition: "top-right",
    pageSize: "a4",
    orientation: "portrait",
  },
  {
    name: "Work Permit - Standard",
    description: "Default form template for work permit requests",
    requestType: "work_permit",
    isDefault: true,
    isActive: true,
    companyName: "Centre3",
    companyNameAr: "سنتر3",
    headerColor: "#1D4ED8",
    formTitle: "Work Permit",
    formTitleAr: "تصريح عمل",
    formSubtitle: "Authorized Work Access",
    formSubtitleAr: "تصريح دخول العمل",
    footerDepartment: "Facility Management",
    footerDepartmentAr: "إدارة المرافق",
    footerPhone: "+966 11 000 0000",
    footerEmail: "facility@centre3.com",
    footerText: "This work permit must be displayed at all times while on premises.",
    footerTextAr: "يجب عرض تصريح العمل هذا في جميع الأوقات أثناء التواجد في المبنى.",
    disclaimerText: "This work permit is valid only for the specified dates and scope of work. All workers must comply with site safety regulations and wear required PPE.",
    disclaimerTextAr: "تصريح العمل هذا صالح فقط للتواريخ ونطاق العمل المحددين. يجب على جميع العمال الامتثال للوائح السلامة في الموقع وارتداء معدات الحماية المطلوبة.",
    showQrCode: true,
    qrCodePosition: "top-right",
    pageSize: "a4",
    orientation: "portrait",
  },
  {
    name: "TEP - Standard",
    description: "Default form template for TEP requests",
    requestType: "tep",
    isDefault: true,
    isActive: true,
    companyName: "Centre3",
    companyNameAr: "سنتر3",
    headerColor: "#B45309",
    formTitle: "Temporary Entry Permit",
    formTitleAr: "تصريح دخول مؤقت",
    formSubtitle: "TEP Access Authorization",
    formSubtitleAr: "تصريح دخول مؤقت",
    footerDepartment: "Security Operations Centre",
    footerDepartmentAr: "مركز العمليات الأمنية",
    footerPhone: "+966 11 000 0000",
    footerEmail: "security@centre3.com",
    footerText: "Temporary entry permit - valid for specified duration only.",
    footerTextAr: "تصريح دخول مؤقت - صالح للمدة المحددة فقط.",
    disclaimerText: "This temporary entry permit is strictly limited to the specified time and area. Unauthorized access beyond the permitted scope will result in immediate revocation.",
    disclaimerTextAr: "تصريح الدخول المؤقت هذا محدود بشكل صارم بالوقت والمنطقة المحددين.",
    showQrCode: true,
    qrCodePosition: "top-right",
    pageSize: "a4",
    orientation: "portrait",
  },
  {
    name: "MOP - Standard",
    description: "Default form template for MOP requests",
    requestType: "mop",
    isDefault: true,
    isActive: true,
    companyName: "Centre3",
    companyNameAr: "سنتر3",
    headerColor: "#059669",
    formTitle: "Method of Procedure",
    formTitleAr: "إجراء طريقة العمل",
    formSubtitle: "MOP Authorization",
    formSubtitleAr: "تصريح إجراء طريقة العمل",
    footerDepartment: "Operations Management",
    footerDepartmentAr: "إدارة العمليات",
    footerPhone: "+966 11 000 0000",
    footerEmail: "operations@centre3.com",
    footerText: "This MOP authorization must be followed precisely as documented.",
    footerTextAr: "يجب اتباع تصريح إجراء طريقة العمل هذا بدقة كما هو موثق.",
    disclaimerText: "This Method of Procedure authorization is valid only for the specified scope and timeline. Any deviation requires re-approval.",
    disclaimerTextAr: "تصريح إجراء طريقة العمل هذا صالح فقط للنطاق والجدول الزمني المحددين.",
    showQrCode: true,
    qrCodePosition: "top-right",
    pageSize: "a4",
    orientation: "portrait",
  },
];

for (const t of templates) {
  try {
    await conn.execute(
      `INSERT INTO formTemplates (name, description, requestType, isDefault, isActive, companyName, companyNameAr, headerColor, formTitle, formTitleAr, formSubtitle, formSubtitleAr, footerDepartment, footerDepartmentAr, footerPhone, footerEmail, footerText, footerTextAr, disclaimerText, disclaimerTextAr, showQrCode, qrCodePosition, pageSize, orientation, fields, infoSections, safetyRules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.name, t.description, t.requestType, t.isDefault, t.isActive,
        t.companyName, t.companyNameAr, t.headerColor,
        t.formTitle, t.formTitleAr, t.formSubtitle, t.formSubtitleAr,
        t.footerDepartment, t.footerDepartmentAr, t.footerPhone, t.footerEmail,
        t.footerText, t.footerTextAr, t.disclaimerText, t.disclaimerTextAr,
        t.showQrCode, t.qrCodePosition, t.pageSize, t.orientation,
        defaultFields, defaultInfoSections, defaultSafetyRules,
      ]
    );
    console.log(`✅ Created template: ${t.name}`);
  } catch (err) {
    console.error(`❌ Failed to create template: ${t.name}`, err.message);
  }
}

console.log("\n✅ All default form templates seeded");
await conn.end();
