import { Prompt, Inter } from "next/font/google";
import "./globals.css";
import 'sweetalert2/dist/sweetalert2.min.css';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/db";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
  const storeName = setting?.storeName || "mymuayy";
  
  return {
    title: `${storeName} • STORE - เติมเงินและสินค้าดิจิทัลออโต้`,
    description: "จำหน่ายแอปพรีเมียม สตรีมมิ่ง เติมเกม เติมเงินมือถือ บริการอัตโนมัติตลอด 24 ชั่วโมง สะดวก รวดเร็ว ปลอดภัย โทนขาวคลีนหรูหรา",
  };
}

export default async function RootLayout({ children }) {
  const setting = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
  const siteSetting = setting || { storeName: 'mymuayy', logoUrl: '' };

  return (
    <html
      lang="th"
      className={`${prompt.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f0f6ff] text-[#0f1e3d]">
        <script dangerouslySetInnerHTML={{ __html: `
          // Disable right click context menu
          document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
          }, false);
          
          // Disable common DevTools shortcuts
          document.addEventListener('keydown', function(e) {
            // F12 key
            if (e.keyCode === 123) {
              e.preventDefault();
              return false;
            }
            // Ctrl+Shift+I (Inspect elements), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspect elements pointer)
            if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
              e.preventDefault();
              return false;
            }
            // Ctrl+U (View Source code)
            if (e.ctrlKey && e.keyCode === 85) {
              e.preventDefault();
              return false;
            }
            // Ctrl+S (Save page HTML/resources)
            if (e.ctrlKey && e.keyCode === 83) {
              e.preventDefault();
              return false;
            }
          }, false);
        ` }} />
        <Header siteSetting={siteSetting} />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer siteSetting={siteSetting} />
      </body>
    </html>
  );
}
