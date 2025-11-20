export const metadata = {
  title: "YOLO Project",
  description: "Full-stack application with YOLO integration",
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
