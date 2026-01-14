export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-10rem)] [&>*]:min-w-0">{children}</div>
  );
}

