import Header from './Header';
import { ChatContainer } from './chat/ChatContainer';

export default function Layout() {
  return (
    <div className="fixed inset-0 flex flex-col">
      <Header />
      <ChatContainer />
    </div>
  );
}
