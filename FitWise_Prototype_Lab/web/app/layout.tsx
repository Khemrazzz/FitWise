import "./styles.css";

export const metadata = {
  title: "FitWise Prototype Lab",
  description: "ML vs Rule-Based vs Gemini workout-plan prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
