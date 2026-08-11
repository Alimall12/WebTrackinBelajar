import "./globals.css";

export const metadata = {
  title: "StemsatoPTN — Tracker Belajar SNBT/UTBK",
  description: "LMS & Progress Tracker SNBT/UTBK privat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
