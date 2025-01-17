import ChatText from "@/components/ChatText";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-lg w-full px-6 py-8 bg-white border border-gray-300 rounded-lg shadow-md space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Arbichat!</h1>
          <p className="text-gray-700 text-sm">
            This is an <a href="#" className="text-blue-600 underline">open-source</a> AI chatbot that uses{" "}
            <a href="#" className="text-blue-600 underline">OpenAI Functions</a> to interact with{" "}
            <a href="#" className="text-blue-600 underline">Arbitrum</a> with natural language.
          </p>
          <p className="text-gray-700 text-sm">
            You can ask it about how to build on Arbitrum, where to get started, and receive guidance from Arbichat.
          </p>
        </header>
        <ChatText />
      </div>
    </div>
  );
}
