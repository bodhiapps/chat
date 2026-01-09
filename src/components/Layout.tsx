import Header from './Header';
import ChatDemo from './ChatDemo';

export default function Layout() {
  return (
    <div className="fixed inset-0 flex flex-col">
      <Header />
      <ChatDemo />
    </div>
  );
}
