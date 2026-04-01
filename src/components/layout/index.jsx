import Header from "../header";

const Layout = ({ children, bgColor = "", headerBg }) => {
  return (
    <div className="min-h-screen dark">
      <div className="container mx-auto py-6 px-4">
        <Header bgColor={headerBg} />
        {children}
      </div>
    </div>
  );
};

export default Layout;
