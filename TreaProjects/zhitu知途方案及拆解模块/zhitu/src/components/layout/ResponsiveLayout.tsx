import Navbar from './Navbar';
import TabBar from './TabBar';

export default function ResponsiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />
      <main className="pb-20 lg:pb-0">{children}</main>
      <TabBar />
    </div>
  );
}
