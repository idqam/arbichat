import ChatText from "@/components/ChatText";

export default function Home() {
  return (
    <div className="home-container">
      <div className="chat-box">
        <header className="chat-header">
          <h1 className="chat-title">Welcome to Arbichat!</h1>
          <p className="chat-description">
            This is an{" "}
            <a
              href="https://en.wikipedia.org/wiki/Open-source_software"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              open-source
            </a>{" "}
            AI chatbot that uses{" "}
            <a
              href="https://platform.openai.com/docs/guides/function-calling"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAI Functions
            </a>{" "}
            to interact with{" "}
            <a
              href="https://arbitrum.io/"
              className="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Arbitrum
            </a>{" "}
            with natural language.
          </p>
          <p className="chat-description">
            You can ask it about how to build on Arbitrum, where to get started,
            and receive guidance from Arbichat.
          </p>
        </header>
        <ChatText />
      </div>
    </div>
  );
}
