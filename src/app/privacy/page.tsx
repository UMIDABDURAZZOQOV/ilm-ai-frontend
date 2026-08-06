export const metadata = {
  title: "Maxfiylik siyosati — Ilm AI",
  description: "Ilm AI qanday ma'lumot yig'adi, ishlatadi va himoya qiladi.",
};

// Public privacy policy for Google Play + the app. Written to honestly reflect
// what the app does: Google sign-in, name+age, uploaded study materials, voice/
// photo sent to AI, and — stated plainly — that AI processing goes through OpenAI
// under its data-sharing program, so content may help improve their models.
export default function PrivacyPage() {
  const updated = "2026-08-06";
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 22px 96px", lineHeight: 1.7 }}>
      <a href="/" style={{ opacity: 0.7, textDecoration: "none", fontWeight: 600 }}>‹ Ilm AI</a>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "18px 0 6px" }}>Maxfiylik siyosati</h1>
      <p style={{ opacity: 0.6, marginTop: 0 }}>Oxirgi yangilanish: {updated}</p>

      <p>
        Ilm AI (&quot;biz&quot;, &quot;ilova&quot;) — sun&apos;iy intellektga asoslangan ta&apos;lim
        yordamchisi. Ushbu siyosat qanday ma&apos;lumot yig&apos;ishimiz, uni nima uchun ishlatishimiz
        va sizning huquqlaringizni tushuntiradi. Ilovadan foydalanish orqali siz ushbu shartlarga
        rozilik bildirasiz.
      </p>

      <Section title="1. Biz yig'adigan ma'lumotlar">
        <ul>
          <li><b>Hisob ma&apos;lumotlari:</b> Google orqali kirganingizda — ismingiz, elektron pochtangiz va profil rasmingiz.</li>
          <li><b>Profil:</b> siz tanlagan ism va yoshingiz.</li>
          <li><b>Siz yuklagan kontent:</b> o&apos;quv hujjatlari, rasmlar, ovozli xabarlar, chat matnlari va test javoblari.</li>
          <li><b>Foydalanish ma&apos;lumotlari:</b> darsdagi taraqqiyot, ball, streak, qurilma va bildirishnoma tokeni.</li>
        </ul>
      </Section>

      <Section title="2. Ma'lumotlardan qanday foydalanamiz">
        <ul>
          <li>Ta&apos;lim xizmatini ko&apos;rsatish: tushuntirish, baholash, test va kontent yaratish.</li>
          <li>Sizga moslashtirish: zaif joylaringiz, maqsad va darajangizga qarab yordam berish.</li>
          <li>Bildirishnoma va eslatmalar yuborish (agar yoqilgan bo&apos;lsa).</li>
          <li>Ilovani yaxshilash va xavfsizligini ta&apos;minlash.</li>
        </ul>
      </Section>

      <Section title="3. Sun'iy intellekt (AI) va uchinchi tomonlar">
        <p>
          AI imkoniyatlarini (chat, ovozli yordamchi, esse/nutq baholash, kontent yaratish) ishlatishda
          siz yuborgan kontent — matn, rasm yoki ovoz — qayta ishlash uchun <b>OpenAI</b> xizmatiga
          yuboriladi.
        </p>
        <p style={{ background: "rgba(240,180,60,.12)", border: "1px solid rgba(240,180,60,.35)", borderRadius: 12, padding: "12px 14px" }}>
          <b>Muhim:</b> Biz OpenAI&apos;ning <b>ma&apos;lumot ulashish (data-sharing)</b> dasturidan
          foydalanamiz. Bu shuni anglatadiki, siz yuborgan kontent OpenAI tomonidan o&apos;z sun&apos;iy
          intellekt modellarini yaxshilash uchun ham ishlatilishi mumkin. Shaxsiy yoki maxfiy
          ma&apos;lumotni ilovaga yuborishdan oldin buni hisobga oling.
        </p>
        <p>Boshqa xizmatlar:</p>
        <ul>
          <li><b>Google</b> — hisobga kirish (autentifikatsiya).</li>
          <li><b>Hosting</b> (server) provayderlari — ma&apos;lumotni saqlash va yetkazish.</li>
          <li><b>Telegram</b> — agar siz uni ulasangiz (eslatmalar uchun).</li>
        </ul>
        <p>Biz sizning shaxsiy ma&apos;lumotlaringizni <b>sotmaymiz</b>.</p>
      </Section>

      <Section title="4. Bolalar">
        <p>
          Ilovadan o&apos;quvchilar foydalanishi mumkin. Agar foydalanuvchi 13 yoshdan kichik bo&apos;lsa,
          undan ilovadan ota-ona yoki vasiy nazorati va roziligi bilan foydalanishni so&apos;raymiz.
          Yuqoridagi 3-bo&apos;limda ko&apos;rsatilganidek, yuborilgan kontent AI modellarini yaxshilash
          uchun ishlatilishi mumkinligini ota-onalar hisobga olishlari lozim.
        </p>
      </Section>

      <Section title="5. Ma'lumotni saqlash va xavfsizlik">
        <p>
          Ma&apos;lumotlaringizni xizmatni ko&apos;rsatish uchun zarur bo&apos;lgan muddat davomida
          saqlaymiz va uni himoya qilish uchun asosli texnik choralarni ko&apos;ramiz. Hisobingizni
          o&apos;chirganingizda ma&apos;lumotlaringiz o&apos;chiriladi (uchinchi tomon xizmatlariga
          allaqachon yuborilgan kontent bundan mustasno bo&apos;lishi mumkin).
        </p>
      </Section>

      <Section title="6. Sizning huquqlaringiz">
        <ul>
          <li>Ma&apos;lumotlaringizni ko&apos;rish va tuzatish.</li>
          <li>Hisobingizni va ma&apos;lumotlaringizni o&apos;chirish (ilova ichida yoki biz bilan bog&apos;lanib).</li>
          <li>Bildirishnomalarni o&apos;chirish.</li>
        </ul>
      </Section>

      <Section title="7. O'zgarishlar">
        <p>
          Ushbu siyosatni vaqti-vaqti bilan yangilashimiz mumkin. Muhim o&apos;zgarishlar bo&apos;lsa,
          ilova yoki ushbu sahifa orqali xabar beramiz.
        </p>
      </Section>

      <Section title="8. Bog'lanish">
        <p>
          Savollar bo&apos;lsa biz bilan bog&apos;laning:{" "}
          <b>ashirovzulfiqor2@gmail.com</b>
        </p>
      </Section>

      <p style={{ opacity: 0.5, fontSize: ".9rem", marginTop: 40 }}>© 2026 Ilm AI</p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 6 }}>{title}</h2>
      {children}
    </section>
  );
}
