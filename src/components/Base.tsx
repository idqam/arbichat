const Base = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex flex-col items-center justify-between pt-96">
      <div className="absolute top-5 hidden w-full justify-between px-5 sm:flex">
        PLACEHOLDER
      </div>
      <div className="border-gray-200sm:mx-0 mx-5 mt-20 max-w-screen-md rounded-md border sm:w-full"></div>
      {children}
    </main>
  );
};

export default Base;
