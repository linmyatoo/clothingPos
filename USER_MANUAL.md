# Clothing POS - User Manual | အဝတ်အထည်အရောင်းဆိုင် စနစ် အသုံးပြုသူလမ်းညွှန်

Welcome to the Clothing Point of Sale (POS) system! This application is designed to help you manage your store's inventory, process sales, and track revenue seamlessly.  
အဝတ်အထည်အရောင်းဆိုင် (POS) စနစ်မှ ကြိုဆိုပါတယ်။ ဤစနစ်ကို သင့်ဆိုင်၏ ကုန်ပစ္စည်းစာရင်းများ၊ အရောင်းအဝယ်များနှင့် ဝင်ငွေများကို လွယ်ကူချောမွေ့စွာ စီမံခန့်ခွဲနိုင်ရန် ဖန်တီးထားခြင်းဖြစ်ပါသည်။

---

## Table of Contents | မာတိကာ
1. [Getting Started (Login) | စတင်အသုံးပြုခြင်း (လော့ဂ်အင်ဝင်ခြင်း)](#1-getting-started-login)
2. [Roles & Permissions | ရာထူးနှင့် လုပ်ပိုင်ခွင့်များ](#2-roles--permissions)
3. [The Register (POS) | အရောင်းကောင်တာ](#3-the-register-pos)
4. [Managing Inventory (Products) | ကုန်ပစ္စည်းစာရင်း စီမံခန့်ခွဲခြင်း](#4-managing-inventory-products)
5. [Managing Staff (Employees) | ဝန်ထမ်းများ စီမံခန့်ခွဲခြင်း](#5-managing-staff-employees)
6. [Analytics (Reports & Dashboard) | အစီရင်ခံစာနှင့် ဒက်ရှ်ဘုတ်](#6-analytics-reports--dashboard)

---

## 1. Getting Started (Login) | စတင်အသုံးပြုခြင်း (လော့ဂ်အင်ဝင်ခြင်း)

You can access your system securely from any browser.  
သင်၏စနစ်ကို မည်သည့်ဘရောက်ဇာ (Browser) မှမဆို လုံခြုံစွာ ဝင်ရောက်အသုံးပြုနိုင်ပါသည်။

*   **English:**
    1. Navigate to your store's web link.
    2. Enter your Email Address and Password on the login page.
    3. Click "Sign in to account".
    *If you forget your password, please contact your store Administrator.*
*   **မြန်မာစာ:**
    ၁။ သင့်ဆိုင်၏ ဝဘ်ဆိုဒ်လင့်ခ်သို့ ဝင်ရောက်ပါ။
    ၂။ လော့ဂ်အင်စာမျက်နှာတွင် သင်၏ အီးမေးလ်နှင့် စကားဝှက်ကို ထည့်သွင်းပါ။
    ၃။ "Sign in to account" ကိုနှိပ်ပါ။
    *(စကားဝှက် မေ့သွားပါက ဆိုင်၏ အက်ဒမင်ထံ ဆက်သွယ်ပါ။)*

---

## 2. Roles & Permissions | ရာထူးနှင့် လုပ်ပိုင်ခွင့်များ

The system has two distinct user roles to protect sensitive information:  
စနစ်တွင် အရေးကြီးသောအချက်အလက်များကို ကာကွယ်ရန်အတွက် အသုံးပြုသူ ရာထူး (၂) မျိုး ပါရှိပါသည် -

*   **Administrator (အက်ဒမင်):** Has full access. Can view revenue reports, add/edit/delete products and inventory, manage employee accounts, and process sales.
    (စနစ်တစ်ခုလုံးကို အပြည့်အဝ အသုံးပြုခွင့်ရှိသည်။ ဝင်ငွေအစီရင်ခံစာများ ကြည့်ရှုခြင်း၊ ကုန်ပစ္စည်းများ အသစ်ထည့်ခြင်း/ပြင်ဆင်ခြင်း/ဖျက်ခြင်း၊ ဝန်ထမ်းအကောင့်များ စီမံခန့်ခွဲခြင်းနှင့် အရောင်းအဝယ်များ ပြုလုပ်ခြင်းတို့ကို ဆောင်ရွက်နိုင်သည်။)
*   **Employee / Cashier (အရောင်းဝန်ထမ်း):** Restricted access. Can only access the **Register (POS)** page to process sales for customers, and view their own limited sales history.
    (ကန့်သတ်ချက်ဖြင့်သာ အသုံးပြုနိုင်သည်။ ဖောက်သည်များအတွက် အရောင်းအဝယ်လုပ်ရန် **Register (POS)** စာမျက်နှာကိုသာ ဝင်ရောက်အသုံးပြုနိုင်ပြီး မိမိရောင်းချခဲ့သော မှတ်တမ်းကိုသာ အနည်းငယ် ကြည့်ရှုနိုင်သည်။)

---

## 3. The Register (POS) | အရောင်းကောင်တာ
*(Available to Admins & Employees | အက်ဒမင်နှင့် ဝန်ထမ်းများ အသုံးပြုနိုင်သည်)*

The Register is the core of your daily operations where sales are captured.  
အရောင်းကောင်တာသည် နေ့စဉ်အရောင်းအဝယ်များကို ပြုလုပ်မှတ်တမ်းတင်သည့် အဓိကနေရာဖြစ်ပါသည်။

### How to process a sale | အရောင်းအဝယ်ပြုလုပ်ပုံ:
1. **Find a Product (ကုန်ပစ္စည်း ရှာဖွေခြင်း)**: 
    - Use the **Search Bar** to type a product name or brand. (ရှာဖွေရန်အကွက်တွင် နာမည် ပြုစုရိုက်ထည့်ပါ။)
    - Alternatively, use the **Category filters** (All, Men, Women, Kids) to narrow down the grid. (သို့မဟုတ် အမျိုးအစားအလိုက် ခွဲခြားကြည့်ရှုပါ။)
2. **Add to Cart (ခြင်းထဲသို့ ထည့်ခြင်း)**: 
    - Click directly on a product card to add it to your order. (ကုန်ပစ္စည်းကတ်ကို တိုက်ရိုက်နှိပ်ပြီး ခြင်းထဲသို့ ထည့်ပါ။)
3. **Manage the Cart (ခြင်းစာရင်းကို ပြင်ဆင်ခြင်း)**:
    - Use the **[+]** and **[-]** buttons on an item to change quantities. (အရေအတွက်ပြောင်းလဲရန် အပေါင်း/အနှုတ် ခလုတ်များကို သုံးပါ။)
    - Use the **Red Trash Can** icon at the top of the cart to clear the entire order if needed. (အော်ဒါတစ်ခုလုံး ဖျက်ပစ်လိုပါက အနီရောင် အမှိုက်ပုံးပုံကို နှိပ်ပါ။)
4. **Checkout (ငွေရှင်းခြင်း)**:
    - Select a Payment Method from the bottom of the cart (Card, Cash, QR, More). (ပေးချေမည့်စနစ် - ဥပမာ ငွေသား၊ ကတ် များကို ရွေးချယ်ပါ။)
    - Review the total amount and click the **Charge** button. (ကျသင့်ငွေကို စစ်ဆေးပြီး **Charge** ကိုနှိပ်ပါ။)
    - A confirmation screen will appear. Click **Confirm & Charge** to complete the transaction and deduct stock from your inventory. (အတည်ပြုပြီးပါက ကုန်ပစ္စည်းစာရင်းမှ အရေအတွက် အလိုအလျောက် နုတ်သွားပါမည်။)
5. **History (မှတ်တမ်း)**:
    - You can view today's transactions by clicking the **"History"** button at the top. (ယနေ့ရောင်းချခဲ့သော မှတ်တမ်းများကို အပေါ်ရှိ History တွင် ကြည့်ရှုနိုင်သည်။)

---

## 4. Managing Inventory (Products) | ကုန်ပစ္စည်းစာရင်း စီမံခန့်ခွဲခြင်း
*(Admin Only | အက်ဒမင်သာ အသုံးပြုနိုင်သည်)*

From the sidebar menu, click **Products** to view your inventory catalog.  
ဘေးဘက်မီနူးမှ **Products** ကိုနှိပ်၍ ကုန်ပစ္စည်းများကို ကြည့်ရှုပါ။

### How to Add a New Product | ကုန်ပစ္စည်းအသစ် ထည့်သွင်းနည်း:
1. Click the **"Add Product"** button in the top right. (ညာဘက်အပေါ်ရှိ **"Add Product"** ကိုနှိပ်ပါ။)
2. Enter the Product Details: Name, Brand, Category, and Description. (အမည်၊ တံဆိပ်၊ အမျိုးအစားနှင့် အသေးစိတ်ကို ထည့်ပါ။)
3. Under the **Variants** section, you must add at least one Size and Color combination. (အရွယ်အစားနှင့် အရောင်ကို ထည့်သွင်းရပါမည်။)
    - Define the Cost Price and Selling Price. (ဝယ်ရင်းဈေးနှင့် ရောင်းဈေးကို သတ်မှတ်ပါ။)
    - Set the **Initial Stock**. (လက်ရှိ ဆိုင်တွင်ရှိသော အရေအတွက်ကို ထည့်ပါ။)
    - *You can add multiple variants by clicking "+ Add Another Variant".*
4. Click **Create Product**. (**Create Product** ကိုနှိပ်ပါ။)

### Editing Products & Updating Stock or Images | ကုန်ပစ္စည်းပြင်ဆင်ခြင်းနှင့် ဓာတ်ပုံထည့်ခြင်း:
1. Find an existing product and click the **Pencil icon** (Edit). (ကုန်ပစ္စည်းတစ်ခုကိုရှာ၍ ခဲတံပုံ - ပြင်ဆင်မည် ကိုနှိပ်ပါ။)
2. Click **"Upload Image"** to attach a photo to the product. (ဓာတ်ပုံထည့်ရန် **"Upload Image"** ကိုနှိပ်ပါ။)
3. Switch to the **Variants** tab to easily update Prices or Stock Inventory. (ဈေးနှုန်း သို့မဟုတ် အရေအတွက်ကို ပြင်ဆင်ရန် **Variants** ခလုတ်ကိုနှိပ်၍ ပြင်ဆင်ပါ။)

---

## 5. Managing Staff (Employees) | ဝန်ထမ်းများ စီမံခန့်ခွဲခြင်း
*(Admin Only | အက်ဒမင်သာ အသုံးပြုနိုင်သည်)*

From the sidebar menu, click **Employees** to view your staff network.  
ဘေးဘက်မီနူးမှ **Employees** ကိုနှိပ်၍ ဝန်ထမ်းစာရင်းကို ဝင်ကြည့်ပါ။

### How to Add an Employee | ဝန်ထမ်းအသစ် ထည့်သွင်းနည်း:
1. Click **"Add Employee"**. (**"Add Employee"** ကိုနှိပ်ပါ။)
2. Fill in their Full Name and Email Address. (အမည်နှင့် အီးမေးလ် ထည့်ပါ။)
3. Select their Role (Employee or Admin). (ရာထူး ရွေးချယ်ပါ။)
4. Assign them a secure Password (must be at least 6 characters). (စကားဝှက် သတ်မှတ်ပေးပါ - အနည်းဆုံး ဂဏန်း/စာလုံး ၆ လုံး ရှိရမည်။)
5. Click **Add Employee**.

### How to Edit or Change an Employee's Password | စကားဝှက် နှင့် အချက်အလက်များ ပြင်ဆင်နည်း:
1. Find the employee in the list and click their **Edit** icon. (ဝန်ထမ်းစာရင်းမှ ခဲတံပုံ - ပြင်ဆင်မည် ကိုနှိပ်ပါ။)
2. You can update their Name, Email, or Role. (အမည်၊ အီးမေးလ် ပြင်ဆင်နိုင်သည်။)
3. **To change their password**: Type a new password into the password box. (စကားဝှက် အသစ်ပေးလိုပါက အသစ်ရိုက်ထည့်ပါ။)
4. **To keep their current password**: Leave the password box completely blank. (လက်ရှိစကားဝှက်ကိုသာ ဆက်ထားလိုပါက စကားဝှက်အကွက်တွင် ဘာမျှမရိုက်ဘဲ အလွတ်ထားခဲ့ပါ။)
5. Click **Update Employee**. (**Update Employee** ကိုနှိပ်ပါ။)

---

## 6. Analytics (Reports & Dashboard) | အစီရင်ခံစာနှင့် ဒက်ရှ်ဘုတ်
*(Admin Only | အက်ဒမင်သာ အသုံးပြုနိုင်သည်)*

The system automatically calculates your store's performance.  
စနစ်မှ ဆိုင်၏ ဝင်ငွေအခြေအနေများကို အလိုအလျောက် တွက်ချက်ပေးပါသည်။

### The Dashboard | ပင်မစာမျက်နှာ (Dashboard):
The Dashboard offers a real-time glance at today's activity: (ယနေ့အတွက် အောက်ပါတို့ကို အချိန်နှင့်တစ်ပြေးညီ ကြည့်ရှုနိုင်သည် -)
- **Today's Revenue** & Transaction Count. (ယနေ့ဝင်ငွေနှင့် ရောင်းချရသည့် အကြိမ်အရေအတွက်)
- **This Month's Earnings**. (ယခုလအတွက် စုစုပေါင်းဝင်ငွေ)
- **Recent Activity Feed**. (နောက်ဆုံးရောင်းချခဲ့သော မှတ်တမ်း ၅ ခု)
- **Low Stock Alerts**: Any product variant that has 5 or fewer items remaining will be highlighted in red. (လက်ကျန် ၅ ခုနှင့်အောက် ရောက်နေသော ကုန်ပစ္စည်းများကို အနီရောင်ဖြင့် ပြသပေးထားမည်ဖြစ်ပြီး ထပ်မံဖြည့်တင်းနိုင်ပါသည်။)

### Reports Page | အစီရင်ခံစာများ:
For detailed accounting, navigate to the **Reports** tab. (အသေးစိတ်သိရှိလိုပါက **Reports** သို့ ဝင်ရောက်ပါ။)
1. **Daily Report**: Look at sales across hours for a specific day. (နေ့စဉ် အချိန်အလိုက် ရောင်းအားကို ကြည့်ရှုရန်)
2. **Monthly Report**: Track revenue trends throughout the weeks of a month. (လအလိုက် အပတ်စဉ် ဝင်ငွေအခြေအနေကို ကြည့်ရှုရန်)
3. **Yearly Report**: Compare month-to-month tracking to see overall business growth. (နှစ်အလိုက် လစဉ်ရောင်းအား နှိုင်းယှဉ်ချက်ကို ကြည့်ရှုရန်)

---
*End of Manual | လမ်းညွှန်ချက် ပြီးဆုံးပါပြီ။*
