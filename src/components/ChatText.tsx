import { Textarea } from "./ui/textarea";

const ChatText = () => {
  return (
    <div
      id="outer-container"
      className="max-w-3xl mx-auto my-8 p-6 mt-48  border-gray-200 rounded-lg shadow-md bg-white"
    >
      <div id="welcome-header" className="p-6 mb-6 border-b border-gray-300">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Welcome to PLACEHOLDER
        </h1>

        <p className="text-gray-600 mb-6">
          This is an{" "}
          <a href="#" className="text-blue-500 underline">
            open-source
          </a>{" "}
          AI chatbot that uses{" "}
          <a href="#" className="text-blue-500 underline">
            OpenAI Functions
          </a>{" "}
          <b className="text-red-900">MORE PLACE HOLDER TEXT </b>
        </p>
      </div>
      <div id="temp-more" className="bg-gray-700 space-y-4">
        <div>TEST</div>
        <div>TEST</div>
        <div>TEST</div>
        <div>TEST</div>
      </div>
      <div className="mt-6 bg-red-800">
        <Textarea />
      </div>
    </div>
  );
};

export default ChatText;
