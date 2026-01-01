export const metadata = {
  title: 'QBos Proof Harness',
  description: 'QuietBuild OS - Engine Validation & API Testing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
