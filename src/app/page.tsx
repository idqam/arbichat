import ChatText from "@/components/ChatText";

export default function Home() {
  return (
    <div
      id="outer-container"
      className="max-w-3xl mx-auto my-8 p-6 mt-28 border-gray-200 rounded-lg shadow-md bg-slate-100"
    >
      <div className="flex justify-center">
        <div id="welcome-header" className="p-6 mb-6 border-b border-gray-300">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4 ml-0">
            Welcome to Markdown Chatter
          </h1>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 ml-20">
            What can I help you with today?
          </h2>
        </div>
      </div>
      <ChatText />
    </div>
  );
}
