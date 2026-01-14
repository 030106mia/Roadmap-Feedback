export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-0 [&>*]:min-w-0">{children}</div>
  );
}

